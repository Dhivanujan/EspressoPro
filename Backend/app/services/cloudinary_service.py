import os
import uuid
import asyncio
import mimetypes
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone
from functools import partial
import cloudinary
import cloudinary.uploader
from app.config.settings import settings

class CloudinaryService:
    def __init__(self):
        # Check if Cloudinary configurations exist in Settings
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            try:
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True
                )
                self.enabled = True
                print("Cloudinary Service successfully initialized and configured.")
            except Exception as e:
                print(f"Error configuring Cloudinary SDK: {e}. Falling back to local files.")
                self.enabled = False
        else:
            self.enabled = False
            print("Cloudinary credentials are not configured. POS will use resilient local upload storage fallback.")

        # Ensure local static uploads folder is created (absolute path for stable behavior)
        app_root = Path(__file__).resolve().parents[1]
        self.local_upload_dir = str(app_root / "static" / "uploads")
        os.makedirs(self.local_upload_dir, exist_ok=True)

    def _infer_extension(self, filename: Optional[str], content_type: Optional[str]) -> str:
        if filename:
            _, ext = os.path.splitext(filename)
            if ext:
                return ext.lower()
        if content_type:
            ext = mimetypes.guess_extension(content_type)
            if ext:
                return ext.lower()
        return ".png"

    async def upload_image(
        self,
        file_content: bytes,
        folder: str = "products",
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
    ) -> str:
        """
        Uploads image content to Cloudinary or falls back to saving locally on the POS server.
        Returns secure accessible URL.
        """
        if self.enabled:
            try:
                # Run the blocking Cloudinary SDK upload call inside an async threadpool executor
                def _cloudinary_upload():
                    res = cloudinary.uploader.upload(
                        file_content,
                        folder=folder,
                        resource_type="image"
                    )
                    return res.get("secure_url")

                loop = asyncio.get_running_loop()
                secure_url = await loop.run_in_executor(None, _cloudinary_upload)
                if secure_url:
                    return secure_url
            except Exception as e:
                print(f"Cloudinary upload failed: {e}. Falling back to resilient local saving.")

        # Resilient Local Saving Fallback Engine
        try:
            extension = self._infer_extension(filename, content_type)
            filename = f"{uuid.uuid4().hex}_{int(datetime.now(timezone.utc).timestamp())}{extension}"
            filepath = os.path.join(self.local_upload_dir, filename)

            # Write file bytes locally
            def _write_local_file():
                with open(filepath, "wb") as f:
                    f.write(file_content)
                return f"/static/uploads/{filename}"

            loop = asyncio.get_running_loop()
            local_path = await loop.run_in_executor(None, _write_local_file)
            return local_path
        except Exception as err:
            raise ValueError(f"Failed to write local fallback file: {err}")

cloudinary_service = CloudinaryService()

from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Connection might be dead, cleanup handled on disconnect
                pass

manager = ConnectionManager()
router = APIRouter(prefix="/ws", tags=["Real-time Notifications"])

@router.websocket("/orders")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for listening to real-time order status updates.
    """
    await manager.connect(websocket)
    try:
        # Keep connection alive, listen for any messages from client (optional)
        while True:
            data = await websocket.receive_text()
            # Echo or process if needed
            await websocket.send_json({"echo": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

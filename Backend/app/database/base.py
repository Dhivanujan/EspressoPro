from bson import ObjectId

class Base:
    def __init__(self, **kwargs):
        # Convert _id to string id
        if "_id" in kwargs:
            kwargs["id"] = str(kwargs["_id"])
        elif "id" in kwargs and kwargs["id"]:
            kwargs["id"] = str(kwargs["id"])
            
        for k, v in kwargs.items():
            setattr(self, k, v)

    def to_dict(self):
        d = dict(self.__dict__)
        if "id" in d:
            val = d.pop("id")
            if val:
                try:
                    d["_id"] = ObjectId(val)
                except Exception:
                    d["_id"] = val
        return d

from typing import Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

# Initialize Motor Client
client = AsyncIOMotorClient(settings.MONGODB_URL)
raw_database = client[settings.MONGODB_DB]

class SQLAlchemyMockResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return self

    def first(self):
        return self._items[0] if self._items else None

    def all(self):
        return self._items

class MotorDatabaseWrapper:
    def __init__(self, db):
        self._db = db
        self._staged_objects = []

    def __getitem__(self, name):
        return self._db[name]

    def __getattr__(self, name):
        return getattr(self._db, name)

    async def get(self, model, id) -> Any:
        collection_name = getattr(model, "__tablename__", None)
        if not collection_name:
            return None
        try:
            query_id = ObjectId(id) if isinstance(id, str) and ObjectId.is_valid(id) else id
            doc = await self._db[collection_name].find_one({"_id": query_id})
            return model(**doc) if doc else None
        except Exception:
            return None

    def add(self, obj):
        if obj not in self._staged_objects:
            self._staged_objects.append(obj)

    def add_all(self, objs):
        for obj in objs:
            self.add(obj)

    async def commit(self):
        await self.flush()

    async def rollback(self):
        self._staged_objects.clear()

    async def refresh(self, obj):
        # Refresh is used to populate fields after save
        obj_id = getattr(obj, "_id", None) or getattr(obj, "id", None)
        collection_name = getattr(obj, "__tablename__", None)
        if obj_id and collection_name:
            query_id = ObjectId(obj_id) if isinstance(obj_id, str) and ObjectId.is_valid(obj_id) else obj_id
            doc = await self._db[collection_name].find_one({"_id": query_id})
            if doc:
                # Re-assign properties to obj
                if "_id" in doc:
                    doc["id"] = str(doc["_id"])
                
                from app.database.base import DECIMAL_FIELDS
                from decimal import Decimal
                for k, v in doc.items():
                    if k in DECIMAL_FIELDS and v is not None:
                        try:
                            v = Decimal(str(v)).quantize(Decimal('0.00'))
                        except Exception:
                            pass
                    setattr(obj, k, v)

    async def delete(self, obj):
        obj_id = getattr(obj, "_id", None) or getattr(obj, "id", None)
        collection_name = getattr(obj, "__tablename__", None)
        if obj_id and collection_name:
            query_id = ObjectId(obj_id) if isinstance(obj_id, str) and ObjectId.is_valid(obj_id) else obj_id
            await self._db[collection_name].delete_one({"_id": query_id})
            if obj in self._staged_objects:
                self._staged_objects.remove(obj)

    async def flush(self):
        # Save all staged objects to MongoDB
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        for obj in self._staged_objects:
            collection_name = getattr(obj, "__tablename__", None)
            if not collection_name:
                continue
            
            # Automatically populate created_at and updated_at on the object
            if not getattr(obj, "created_at", None):
                obj.created_at = now
            obj.updated_at = now
            
            # Recursively convert Decimal to float for PyMongo compatibility
            from decimal import Decimal
            def convert_decimals(val):
                if isinstance(val, dict):
                    return {k: convert_decimals(v) for k, v in val.items()}
                elif isinstance(val, list):
                    return [convert_decimals(v) for v in val]
                elif isinstance(val, Decimal):
                    return float(val)
                return val
            
            data = convert_decimals(obj.to_dict())
            obj_id = getattr(obj, "_id", None) or getattr(obj, "id", None)
            
            if obj_id:
                query_id = ObjectId(obj_id) if isinstance(obj_id, str) and ObjectId.is_valid(obj_id) else obj_id
                payload = {k: v for k, v in data.items() if k not in ("id", "_id")}
                await self._db[collection_name].update_one({"_id": query_id}, {"$set": payload})
            else:
                payload = {k: v for k, v in data.items() if k not in ("id", "_id")}
                result = await self._db[collection_name].insert_one(payload)
                obj._id = result.inserted_id
                obj.id = str(result.inserted_id)
                
        self._staged_objects.clear()

    async def close(self):
        pass

    async def execute(self, statement, *args, **kwargs):
        # Handle our custom MockSelect
        if isinstance(statement, MockSelect):
            model = statement.model
            collection_name = getattr(model, "__tablename__", None)
            if not collection_name:
                return SQLAlchemyMockResult([])
                
            query = {}
            from app.database.base import BinaryExpression
            for clause in statement.clauses:
                if isinstance(clause, BinaryExpression):
                    col_name = clause.left.name
                    val = clause.right
                    op = clause.operator
                    
                    # Map column 'id' to '_id' in MongoDB
                    if col_name == "id":
                        col_name = "_id"
                        if isinstance(val, str) and ObjectId.is_valid(val):
                            val = ObjectId(val)
                    elif col_name in ("product_id", "category_id", "cart_id", "cashier_id", "customer_id", "coupon_id", "order_id", "ingredient_id", "item_id"):
                        if isinstance(val, int):
                            val = str(val)
                            
                    if op == "eq":
                        query[col_name] = val
                    elif op == "ne":
                        query[col_name] = {"$ne": val}
                    elif op == "gt":
                        query[col_name] = {"$gt": val}
                    elif op == "lt":
                        query[col_name] = {"$lt": val}
                    elif op == "ge":
                        query[col_name] = {"$gte": val}
                    elif op == "le":
                        query[col_name] = {"$lte": val}
            
            cursor = self._db[collection_name].find(query)
            if statement.offset_val is not None:
                cursor = cursor.skip(statement.offset_val)
            if statement.limit_val is not None:
                cursor = cursor.limit(statement.limit_val)
                
            docs = await cursor.to_list(length=100)
            objects = [model(**doc) for doc in docs]
            return SQLAlchemyMockResult(objects)

        # Fallback to SQLAlchemy statement processing
        try:
            from sqlalchemy.sql.selectable import Select
            if not isinstance(statement, Select):
                return SQLAlchemyMockResult([])
        except ImportError:
            return SQLAlchemyMockResult([])
            
        froms = statement.get_final_froms()
        if not froms:
            return SQLAlchemyMockResult([])
        model = froms[0]
        collection_name = getattr(model, "__tablename__", None)
        if not collection_name:
            return SQLAlchemyMockResult([])
            
        query = {}
        where = statement.whereclause
        
        def parse_where(where_node):
            if where_node is None:
                return {}
            
            from sqlalchemy.sql.elements import BinaryExpression as SABinaryExpression, BooleanClauseList, BindParameter
            if isinstance(where_node, SABinaryExpression):
                left = getattr(where_node, "left", None)
                right = getattr(where_node, "right", None)
                
                col_name = getattr(left, "name", None)
                if not col_name:
                    return {}
                
                val = None
                if hasattr(right, "value"):
                    val = right.value
                elif isinstance(right, BindParameter):
                    val = right.value
                else:
                    val = str(right)
                
                operator = getattr(where_node, "operator", None)
                op_name = operator.__name__ if operator else "eq"
                
                # Map column 'id' to '_id' in MongoDB
                if col_name == "id":
                    col_name = "_id"
                    if isinstance(val, str) and ObjectId.is_valid(val):
                        val = ObjectId(val)
                elif col_name in ("product_id", "category_id", "cart_id", "cashier_id", "customer_id", "coupon_id", "order_id", "ingredient_id", "item_id"):
                    if isinstance(val, int):
                        val = str(val)
                
                if op_name in ("eq", "comma_op", "is_"):
                    return {col_name: val}
                elif op_name in ("ne", "is_not"):
                    return {col_name: {"$ne": val}}
                elif op_name in ("ilike", "like"):
                    pattern = str(val).replace("%", "")
                    return {col_name: {"$regex": pattern, "$options": "i"}}
                elif op_name == "gt":
                    return {col_name: {"$gt": val}}
                elif op_name == "lt":
                    return {col_name: {"$lt": val}}
                elif op_name == "ge":
                    return {col_name: {"$gte": val}}
                elif op_name == "le":
                    return {col_name: {"$lte": val}}
                    
            elif isinstance(where_node, BooleanClauseList):
                sub_queries = [parse_where(c) for c in where_node.clauses]
                combined = {}
                for q in sub_queries:
                    for k, v in q.items():
                        if k in combined:
                            if isinstance(combined[k], dict) and isinstance(v, dict):
                                combined[k].update(v)
                            else:
                                combined[k] = v
                        else:
                            combined[k] = v
                return combined
            return {}

        try:
            query = parse_where(where)
        except Exception:
            pass
            
        cursor = self._db[collection_name].find(query)
        docs = await cursor.to_list(length=100)
        
        objects = [model(**doc) for doc in docs]
        return SQLAlchemyMockResult(objects)

class MockSelect:
    def __init__(self, model):
        self.model = model
        self.clauses = []
        self.offset_val = None
        self.limit_val = None
        self.order_by_val = None

    def filter(self, *clauses):
        self.clauses.extend(clauses)
        return self

    def where(self, *clauses):
        self.clauses.extend(clauses)
        return self

    def offset(self, val):
        self.offset_val = val
        return self

    def limit(self, val):
        self.limit_val = val
        return self

    def order_by(self, *args):
        self.order_by_val = args
        return self

# Wrap the MongoDB client
database = MotorDatabaseWrapper(raw_database)

# Monkeypatch select
import sys
import sqlalchemy

def mock_select_func(*args):
    if args:
        return MockSelect(args[0])
    return MockSelect(None)

sqlalchemy.select = mock_select_func
sys.modules["sqlalchemy"].select = mock_select_func

async def get_db():
    """
    Dependency that yields the wrapped Motor database instance.
    """
    yield database

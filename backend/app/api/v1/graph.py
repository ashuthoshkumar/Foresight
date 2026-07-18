from fastapi import APIRouter, HTTPException
import networkx as nx
from app.services.knowledge_graph import knowledge_graph

router = APIRouter(tags=["Knowledge Graph"])

@router.get("/graph")
async def get_graph():
    """Retrieve the entire knowledge graph."""
    if not knowledge_graph._initialized:
        knowledge_graph.initialize()
    
    try:
        # node_link_data converts the graph into a dict
        data = nx.node_link_data(knowledge_graph.graph)
        if "edges" in data and "links" not in data:
            data["links"] = data.pop("edges")
        return {"success": True, "graph": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

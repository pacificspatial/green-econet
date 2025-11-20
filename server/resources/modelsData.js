const modelData = [
  {
    "name": "MODEL A",
    "title": "モデルA",
    "model_id": 1,
    "description": "This is a description for MODEL A.",
    "workflowId": 'workflows_temp_ise_95aaa71c_us.wfproc_faf9a3fc09528d50',
                  
    "workflowToken": process.env.CARTO_MODELA_WORKFLOW_TOKEN,
    "parameters": ["projectid"]
  },
  {
    "name": "MODEL B",
    "title": "モデルB",
    "model_id": 2,
    "description": "This is a description for MODEL B.",
    "workflowId": 'workflows_temp_ise_95aaa71c_us.wfproc_faf9a3fc09528d50',
    "workflowToken": process.env.CARTO_MODELB_WORKFLOW_TOKEN,
    "parameters": ["projectid"]
  },
  {
    "name": "MODEL C",
    "title": "モデルC",
    "model_id": 3,
    "description": "This is a description for MODEL C.",
    "workflowId": 'workflows_temp_ise_95aaa71c_us.wfproc_faf9a3fc09528d50',
    "workflowToken": process.env.CARTO_MODELC_WORKFLOW_TOKEN,
    "parameters": ["projectid"]
  },
  {
    "name": "MODEL D",
    "title": "モデルD",
    "model_id": 4,
    "description": "This is a description for MODEL D.",
    "workflowId": 'workflows_temp_ise_95aaa71c_us.wfproc_faf9a3fc09528d50',
    "workflowToken": process.env.CARTO_MODELD_WORKFLOW_TOKEN,
    "parameters": ["projectid"]
  }
]

module.exports = {
  modelData
}

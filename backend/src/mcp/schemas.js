export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'search_jobs',
      description: 'Search for job postings across all configured portals based on user preferences',
      parameters: {
        type: 'object',
        properties: {
          roles: { type: 'array', items: { type: 'string' }, description: 'Job roles to search for' },
          keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords to include' },
          locations: { type: 'array', items: { type: 'string' }, description: 'Locations to search in' },
          remote: { type: 'boolean', description: 'Include remote jobs' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_preferences',
      description: 'Update user job search preferences based on what they said in the conversation',
      parameters: {
        type: 'object',
        properties: {
          roles: { type: 'array', items: { type: 'string' } },
          keywords: { type: 'array', items: { type: 'string' } },
          locations: { type: 'array', items: { type: 'string' } },
          remote_only: { type: 'boolean' },
          salary_min: { type: 'number' },
          salary_max: { type: 'number' },
          excluded_companies: { type: 'array', items: { type: 'string' } },
          excluded_keywords: { type: 'array', items: { type: 'string' } },
          raw_preferences: { type: 'string', description: 'Free-text summary of preferences' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_job',
      description: 'Save a job to the user shortlist',
      parameters: {
        type: 'object',
        properties: {
          job_id: { type: 'number', description: 'ID of the job listing to save' },
        },
        required: ['job_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_job_portal',
      description: 'Add a new job portal for scraping',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Portal name' },
          url: { type: 'string', description: 'Portal base URL' },
          type: { type: 'string', enum: ['scraper', 'api'], description: 'Integration type' },
          selectors: {
            type: 'object',
            description: 'CSS selectors for scraping',
            properties: {
              job: { type: 'string' },
              title: { type: 'string' },
              company: { type: 'string' },
              location: { type: 'string' },
              link: { type: 'string' },
            },
          },
        },
        required: ['name', 'url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_daily_report',
      description: 'Generate the daily job report for the user',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
]

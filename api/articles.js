export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DB_ID;

  if (!token || !dbId) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: 'Published',
          checkbox: { equals: true }
        },
        sorts: [{ timestamp: 'created_time', direction: 'descending' }]
      })
    });

    const data = await r.json();

    const articles = data.results.map(page => ({
      id:       page.id,
      title:    page.properties.Title?.title?.[0]?.plain_text    ?? '',
      category: page.properties.Category?.rich_text?.[0]?.plain_text ?? '',
      body:     page.properties.Body?.rich_text?.[0]?.plain_text     ?? '',
      date:     page.properties.Date?.rich_text?.[0]?.plain_text     ?? '',
      size:     page.properties.Size?.select?.name                   ?? 'medium',
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(articles);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const prerender = false;

export async function POST(context) {
  try {
    const body = await context.json();
    const { name, phone, childName, childAge, course, remark } = body || {};

    if (!name || !phone || !childName || !course) {
      return new Response(JSON.stringify({ success: false, error: 'missing-fields', required: ['name','phone','childName','course'], received: { name: !!name, phone: !!phone, childName: !!childName, course: !!course } }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = process.env.TENCENT_DOCS_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'no-token' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const fileId = 'BLIFaCFcKjzc';
    const sheetId = 't00i2h';
    const record = {
      field_values: {
        fkfKit: String(name),
        fGSo8E: String(phone),
        fOYXiS: String(childName),
        fde5Z6: String(childAge || ''),
        f0JNov: String(course),
        ffmMqx: String(remark || ''),
        fHSMJO: Date.now().toString()
      }
    };

    const mcpRes = await fetch('https://docs.qq.com/openapi/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'smartsheet.add_records',
          arguments: { file_id: fileId, sheet_id: sheetId, records: [record] }
        }
      })
    });

    const mcpData = await mcpRes.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'done',
      mcpResult: mcpData.result?.structuredContent
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, step: 'catch' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
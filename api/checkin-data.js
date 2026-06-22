module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  
  const fs = require('fs');
  // 优先使用 DATA_DIR 环境变量，否则 /tmp
  const DATA_DIR = process.env.DATA_DIR || '/tmp';
  const DATA_FILE = DATA_DIR + '/checkin_data.json';
  
  try {
    if (req.method === 'GET') {
      if (fs.existsSync(DATA_FILE)) {
        return res.status(200).json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
      }
      // 返回空标记，让客户端知道没有数据
      return res.status(200).json({empty:true});
    }
    
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          // 按人合并：只更新有更新的学生，防止并发互相覆盖
          let existing = {people:{}, personOrder:[]};
          if (fs.existsSync(DATA_FILE)) {
            existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          }
          if (data.people) {
            Object.keys(data.people).forEach(name => {
              if (!existing.people[name] ||
                  data.people[name].lastTimestamp > existing.people[name].lastTimestamp) {
                existing.people[name] = data.people[name];
              }
            });
          }
          if (data.personOrder) {
            data.personOrder.forEach(n => {
              if (existing.personOrder.indexOf(n) < 0) existing.personOrder.push(n);
            });
          }
          // 确保写入目录存在
          const dir = DATA_FILE.substring(0, DATA_FILE.lastIndexOf('/'));
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
          fs.writeFileSync(DATA_FILE, JSON.stringify(existing), 'utf8');
          res.status(200).json({ok:true});
        } catch(e) {
          res.status(400).json({error:e.message});
        }
      });
      return;
    }
    
    res.status(405).json({error:'method not allowed'});
  } catch(e) {
    res.status(500).json({error:e.message});
  }
};
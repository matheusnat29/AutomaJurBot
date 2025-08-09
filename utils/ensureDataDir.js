// Cria pasta data se não existir
import fs from 'fs';
const dir = './data';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Для раздачи статических файлов HTML/CSS

// Путь к файлу базы данных
const DB_FILE = path.join(__dirname, 'database.json');

// Инициализация базы данных, если её нет
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Получить всех лидов
app.get('/api/leads', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data);
});

// Добавить нового лида
app.post('/api/leads', (req, res) => {
    const newLead = {
        id: Date.now().toString(),
        name: req.body.name || 'Неизвестно',
        phone: req.body.phone || 'Не указан',
        request: req.body.request || 'Без запроса',
        status: 'yellow', // По умолчанию "Думает"
        date: new Date().toLocaleString()
    };

    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    data.push(newLead);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    res.json(newLead);
});

// Обновить статус лида
app.put('/api/leads/:id', (req, res) => {
    const leadId = req.params.id;
    const newStatus = req.body.status;

    let data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    let found = false;

    data = data.map(lead => {
        if (lead.id === leadId) {
            lead.status = newStatus;
            found = true;
        }
        return lead;
    });

    if (found) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Лид не найден' });
    }
});

app.listen(PORT, () => {
    console.log(`CRM сервер запущен на http://localhost:${PORT}`);
});

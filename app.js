const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to search JSON files and save results
function searchJsonFiles(directory, keyword) {
    const results = [];
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const data = JSON.parse(fs.readFileSync(path.join(directory, file)));
            data.forEach(item => {
                if (JSON.stringify(item).toLowerCase().includes(keyword.toLowerCase())) {
                    results.push(item);
                }
            });
        }
    });

    // Save results to a JSON file
    if (results.length > 0) {
        const outputFilename = `search_results/${keyword.replace(/\s+/g, '_')}_results.json`;
        fs.writeFileSync(outputFilename, JSON.stringify(results, null, 2));
        console.log(`Results saved to ${outputFilename}`);
    }

    return results;
}

// Function to format JSON with syntax highlighting
function formatJson(json) {
    const jsonString = JSON.stringify(json, null, 2);
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:\s*)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', (req, res) => {
    const keyword = req.body.keyword;
    const results = searchJsonFiles('cve_data', keyword);
    res.render('results', { results, formatJson });
});

// Ensure search_results directory exists
if (!fs.existsSync('search_results')) {
    fs.mkdirSync('search_results');
}

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

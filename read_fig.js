const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('f:/PhysicaNova/John David Jackson - Classical Electrodynamics 2nd ed. (1975, Wiley).pdf');

pdf(dataBuffer).then(function(data) {
    let lines = data.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("9.16") || lines[i].includes("Figure 9.16") || lines[i].includes("Fig. 9.16")) {
            console.log("--- FOUND AT LINE " + i + " ---");
            let start = Math.max(0, i - 10);
            let end = Math.min(lines.length, i + 20);
            for (let j = start; j < end; j++) {
                console.log(lines[j]);
            }
        }
    }
}).catch(err => {
    console.error("Error reading PDF:", err);
});

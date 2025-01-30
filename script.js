
document.getElementById('risk-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const age = parseInt(document.getElementById('age').value);
    const bmi = parseFloat(document.getElementById('bmi').value);
    const parentalDiabetes = parseInt(document.getElementById('parentalDiabetes').value);
    const systolicBP = parseInt(document.getElementById('systolicBP').value);
    const hdl = parseFloat(document.getElementById('hdl').value);
    const triglycerides = parseFloat(document.getElementById('triglycerides').value);
    const fastingGlucose = parseFloat(document.getElementById('fastingGlucose').value);
    
    const result = calculateDiabetesRisk(age, bmi, parentalDiabetes, systolicBP, hdl, triglycerides, fastingGlucose);
    
    document.getElementById('result').innerHTML = `
        <div id="diabetes-risk-result">7-year diabetes risk is ${result.risk}%.</div>
        <h3>Framingham Diabetes Risk Score Calculation:</h3>
        <p class="equation">Total Score = Σ(β<sub>i</sub> × Patient’s Value)</p>
        <h3>Variables Applied to Calculation:</h3>
        <p class="equation">Total Score = ${result.totalScoreFormula}</p>
        <p class="equation">Total Score = ${result.totalScore}</p>
        <p class="equation">Baseline Probability (Logistic Model): P = 1 / (1 + e^(-Total Score))</p>
        <p class="equation">Estimated 7-Year Diabetes Risk: ${result.risk}%</p>
        <h3>Calculation Details:</h3>
        <table>
            <tr><th>Variable</th><th>Patient Value</th><th>β (Coefficient)</th><th>Contribution</th><th>Calculation</th></tr>
            ${result.tableRows}
        </table>
    `;
});

function calculateDiabetesRisk(age, bmi, parentalDiabetes, systolicBP, hdl, triglycerides, fastingGlucose) {
    // Logistic regression coefficients from Framingham Diabetes Risk Model
    const coefficients = {
        "Age (50-64)": 0.43,  // Compared to age < 50
        "Age (≥65)": 0.55,
        "Parental Diabetes": 0.62,
        "BMI (25-29.9)": 0.85,
        "BMI (≥30)": 1.90,
        "Hypertension (BP ≥ 130/85)": 0.60,
        "HDL-C < 40 mg/dL (Men) or <50 mg/dL (Women)": 0.69,
        "Triglycerides ≥ 150 mg/dL": 0.60,
        "Fasting Glucose (100-126 mg/dL)": 2.10
    };

    // Patient values and risk factor determination
    const patientFactors = {
        "Age (50-64)": age >= 50 && age < 65 ? 1 : 0,
        "Age (≥65)": age >= 65 ? 1 : 0,
        "Parental Diabetes": parentalDiabetes,
        "BMI (25-29.9)": bmi >= 25 && bmi < 30 ? 1 : 0,
        "BMI (≥30)": bmi >= 30 ? 1 : 0,
        "Hypertension (BP ≥ 130/85)": systolicBP >= 130 ? 1 : 0,
        "HDL-C < 40 mg/dL (Men) or <50 mg/dL (Women)": hdl < 40 ? 1 : 0,
        "Triglycerides ≥ 150 mg/dL": triglycerides >= 150 ? 1 : 0,
        "Fasting Glucose (100-126 mg/dL)": fastingGlucose >= 100 && fastingGlucose < 126 ? 1 : 0
    };

    // Compute individual contributions
    const contributions = {};
    let totalScore = 0;
    for (const key in coefficients) {
        contributions[key] = coefficients[key] * patientFactors[key];
        totalScore += contributions[key];
    }

    // Compute probability using logistic regression equation: P = 1 / (1 + e^(-Total Score))
    const probability = (1 / (1 + Math.exp(-totalScore))) * 100;

    // Create table rows for output
    const tableRows = Object.keys(coefficients).map(key => `
        <tr>
            <td>${key}</td>
            <td>${patientFactors[key]}</td>
            <td>${coefficients[key]}</td>
            <td>${contributions[key].toFixed(3)}</td>
            <td>${coefficients[key]} × ${patientFactors[key]}</td>
        </tr>
    `).join('');

    return {
        risk: probability.toFixed(2),
        totalScore: totalScore.toFixed(3),
        totalScoreFormula: Object.keys(coefficients).map(key => `β<sub>i</sub>(${coefficients[key]}) × (${patientFactors[key]})`).join(' + '),
        tableRows
    };
}

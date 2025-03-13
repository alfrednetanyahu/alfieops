document.getElementById('investment-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent page reload

    // Get user inputs
    const years = parseInt(document.getElementById('timeline').value);
    const amount = parseFloat(document.getElementById('amount').value);
    const frequency = document.getElementById('frequency').value;
    const index = document.getElementById('index').value;

    // Set annual return rate based on index choice
    let annualReturnRate = 0.10; // Default for S&P 500
    if (index === 'qqq') annualReturnRate = 0.12;

    // Calculate total periods (months or years)
    let periods = years;
    let effectiveRate = annualReturnRate;

    if (frequency === 'monthly') {
        periods = years * 12;
        effectiveRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1; // Monthly rate
    }

    // Compound interest calculation with regular contributions
    let futureValue = 0;
    for (let i = 0; i < periods; i++) {
        futureValue = (futureValue + amount) * (1 + effectiveRate);
    }

    // Format result
    futureValue = futureValue.toFixed(2);

    // Show result
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3>Simulation Result</h3>
        <p>If you invest <strong>$${amount}</strong> ${frequency}, in ${index.toUpperCase()} with an average return of ${(annualReturnRate * 100).toFixed(2)}%, 
        over <strong>${years} years</strong>, you could potentially have <strong>$${futureValue}</strong>.</p>
        <p><em>Note: This is a simplified estimate and does not account for fees, taxes, or market volatility.</em></p>
    `;
});

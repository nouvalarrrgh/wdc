import html2pdf from 'html2pdf.js';

export const generateExecutiveReport = () => {
    const element = document.getElementById('dashboard-report-content');

    if (!element) {
        console.error("Report content element not found");
        return;
    }

    // Define PDF formatting options
    const opt = {
        margin: 10,
        filename: `StuProd_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporarily add some print-specific classes or remove some UI elements if needed
    // Here we just print the content straight
    html2pdf().set(opt).from(element).save();
};

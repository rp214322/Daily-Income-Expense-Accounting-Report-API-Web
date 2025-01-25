document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://192.168.43.84:8000/api/transactions";

  // Format date helper
  function formatDate(dateString) {
    if (!dateString) return ""; // Handle empty date
    const date = new Date(dateString);
    if (isNaN(date)) return ""; // Handle invalid date
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Load records
  function loadRecords() {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        let rows = "";
        let totalIncome = 0;
        let totalExpense = 0;

        const incomes = data.filter((record) => record.type === "income");
        const expenses = data.filter((record) => record.type === "expense");
        const maxLength = Math.max(incomes.length, expenses.length);

        for (let i = 0; i < maxLength; i++) {
          const expense = expenses[i] || { id: "", transaction_date: "", description: "", amount: "" };
          const income = incomes[i] || { id: "", transaction_date: "", description: "", amount: "" };

          rows += `
            <tr>
              <td>${formatDate(expense.transaction_date)}</td>
              <td>${expense.description || ""}</td>
              <td>${expense.amount || ""}</td>
              <td>
                ${
                  expense.id
                    ? `
                  <i class="fas fa-edit text-primary edit-btn" data-id="${expense.id}" style="cursor: pointer;" title="Edit"></i>
                  <i class="fas fa-trash-alt text-danger delete-btn" data-id="${expense.id}" style="cursor: pointer;" title="Delete"></i>
                  `
                    : ""
                }
              </td>
              <td>${formatDate(income.transaction_date)}</td>
              <td>${income.description || ""}</td>
              <td>${income.amount || ""}</td>
              <td>
                ${
                  income.id
                    ? `
                  <i class="fas fa-edit text-primary edit-btn" data-id="${income.id}" style="cursor: pointer;" title="Edit"></i>
                  <i class="fas fa-trash-alt text-danger delete-btn" data-id="${income.id}" style="cursor: pointer;" title="Delete"></i>
                  `
                    : ""
                }
              </td>
            </tr>
          `;

          if (expense.amount) totalExpense += parseFloat(expense.amount);
          if (income.amount) totalIncome += parseFloat(income.amount);
        }

        // Populate table
        document.querySelector("#records-table tbody").innerHTML = rows;

        // Update totals
        document.querySelector("#total-expense").textContent = totalExpense.toFixed(2);
        document.querySelector("#total-income").textContent = totalIncome.toFixed(2);

        // Calculate profit and loss
        const netTotal = totalIncome - totalExpense;
        document.querySelector("#profit").textContent = netTotal > 0 ? netTotal.toFixed(2) : "0.00";
        document.querySelector("#loss").textContent = netTotal < 0 ? Math.abs(netTotal).toFixed(2) : "0.00";

        // Add event listeners for edit and delete buttons
        document.querySelectorAll(".edit-btn").forEach((btn) =>
          btn.addEventListener("click", () => editRecord(btn.dataset.id))
        );
        document.querySelectorAll(".delete-btn").forEach((btn) =>
          btn.addEventListener("click", () => deleteRecord(btn.dataset.id))
        );
      })
      .catch((err) => console.error("Error loading records:", err));
  }

  // Edit record
  function editRecord(id) {
    Swal.fire("Edit functionality is not implemented yet.", `Record ID: ${id}`, "info");
  }

  // Delete record
  function deleteRecord(id) {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${API_URL}/${id}`, { method: "DELETE" })
          .then(() => {
            Swal.fire("Deleted!", "The record has been deleted.", "success");
            loadRecords();
          })
          .catch((err) => {
            console.error("Error deleting record:", err);
            Swal.fire("Error!", "Failed to delete the record.", "error");
          });
      }
    });
  }

  // Generate PDF
  async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Income and Expense Report", 14, 20);

    // Table headers
    const headers = [["Expense Date", "Expense Description", "Expense Amt", "Income Date", "Income Description", "Income Amt"]];

    // Extract table data dynamically
    const rows = [];
    document.querySelectorAll("#records-table tbody tr").forEach((row) => {
      const cells = row.children;
      rows.push([
        cells[0]?.textContent.trim() || "",
        cells[1]?.textContent.trim() || "",
        cells[2]?.textContent.trim() || "",
        cells[4]?.textContent.trim() || "",
        cells[5]?.textContent.trim() || "",
        cells[6]?.textContent.trim() || "",
      ]);
    });

    // Adding totals row
    rows.push(["Total", "", document.querySelector("#total-expense").textContent, "Total", "", document.querySelector("#total-income").textContent]);

    // Adding profit/loss row
    const netProfit = document.querySelector("#profit").textContent;
    const netLoss = document.querySelector("#loss").textContent;
    rows.push(["", "Profit", netProfit, "", "Loss", netLoss]);

    // Generate table in PDF
    doc.autoTable({
      startY: 30,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { halign: "center" },
      headStyles: { fillColor: [22, 160, 133] },
      columnStyles: { 2: { halign: "right" }, 5: { halign: "right" } },
    });

    // Save the PDF
    doc.save("Income-Expense-Report.pdf");
  }

  // Add event listener for generating PDF
  document.querySelector("#generate-pdf-btn").addEventListener("click", generatePDF);

  // Load records on page load
  loadRecords();
});

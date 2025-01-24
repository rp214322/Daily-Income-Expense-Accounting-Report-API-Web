document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://192.168.43.84:8000/api/transactions";

  // Function to load records
  function loadRecords() {
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        let rows = "";
        let totalIncome = 0;
        let totalExpense = 0;

        const incomes = data.filter(record => record.type === "income");
        const expenses = data.filter(record => record.type === "expense");

        const maxLength = Math.max(incomes.length, expenses.length);

        for (let i = 0; i < maxLength; i++) {
          const expense = expenses[i] || {
            id: "",
            transaction_date: "",
            description: "",
            amount: ""
          };
          const income = incomes[i] || {
            id: "",
            transaction_date: "",
            description: "",
            amount: ""
          };

          rows += `
  <tr>
    <td>${expense.transaction_date || ""}</td>
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
    <td>${income.transaction_date || ""}</td>
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

        document.querySelector("#records-table tbody").innerHTML = rows;

        // Update totals
        document.querySelector("#total-expense").textContent = totalExpense.toFixed(2);
        document.querySelector("#total-income").textContent = totalIncome.toFixed(2);

        // Calculate profit and loss
        const netTotal = totalIncome - totalExpense;
        document.querySelector("#profit").textContent = netTotal > 0 ? netTotal.toFixed(2) : "0.00";
        document.querySelector("#loss").textContent = netTotal < 0 ? Math.abs(netTotal).toFixed(2) : "0.00";
      })
      .catch(err => console.error("Error loading records:", err));
  }

  loadRecords();

  // Show Add Modal
  document.querySelector("#add-record-btn").addEventListener("click", function () {
    $("#add-modal").modal("show");
  });

  // Handle Add Form Submission
  document.querySelector("#add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const data = {
      type: document.querySelector("#type").value,
      transaction_date: document.querySelector("#transaction_date").value,
      description: document.querySelector("#description").value,
      amount: document.querySelector("#amount").value
    };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(() => {
        loadRecords();
        $("#add-modal").modal("hide");
        Swal.fire("Success", "Record added successfully!", "success");
        e.target.reset();
      })
      .catch(err => console.error("Error adding record:", err));
  });

  // Handle Edit and Delete
  document.querySelector("#records-table").addEventListener("click", function (e) {
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.dataset.id;

      fetch(`${API_URL}/${id}`)
        .then(response => response.json())
        .then(record => {
          document.querySelector("#edit-type").value = record.type;
          document.querySelector("#edit-transaction_date").value = record.transaction_date;
          document.querySelector("#edit-description").value = record.description;
          document.querySelector("#edit-amount").value = record.amount;

          $("#edit-modal").modal("show");

          document.querySelector("#edit-form").onsubmit = function (e) {
            e.preventDefault();

            const updatedData = {
              type: document.querySelector("#edit-type").value,
              transaction_date: document.querySelector("#edit-transaction_date").value,
              description: document.querySelector("#edit-description").value,
              amount: document.querySelector("#edit-amount").value
            };

            fetch(`${API_URL}/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedData)
            })
              .then(() => {
                loadRecords();
                $("#edit-modal").modal("hide");
                Swal.fire("Updated", "Record updated successfully!", "success");
              })
              .catch(err => console.error("Error updating record:", err));
          };
        })
        .catch(err => console.error("Error fetching record for editing:", err));
    }

    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!"
      }).then(result => {
        if (result.isConfirmed) {
          fetch(`${API_URL}/${id}`, { method: "DELETE" })
            .then(() => {
              loadRecords();
              Swal.fire("Deleted!", "Your record has been deleted.", "success");
            })
            .catch(err => console.error("Error deleting record:", err));
        }
      });
    }
  });

  // Generate PDF
  async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Income and Expense Report", 14, 20);

    // Table headers
    const headers = [["Type", "Date", "Description", "Amount"]];
    const rows = [];

    // Get data from the table
    document.querySelectorAll("#records-table tbody tr").forEach(row => {
      const cells = row.children;
      rows.push([
        cells[0]?.textContent.trim() || "",
        cells[1]?.textContent.trim() || "",
        cells[2]?.textContent.trim() || "",
        cells[3]?.textContent.trim() || ""
      ]);
    });

    // Add totals
    rows.push(["", "", "Total Income", document.querySelector("#total-income").textContent]);
    rows.push(["", "", "Total Expense", document.querySelector("#total-expense").textContent]);
    rows.push(["", "", "Net Total", document.querySelector("#profit").textContent || document.querySelector("#loss").textContent]);

    doc.autoTable({
      startY: 30,
      head: headers,
      body: rows
    });

    doc.save("Income-Expense-Report.pdf");
  }

  document.querySelector("#generate-pdf-btn").addEventListener("click", generatePDF);
});

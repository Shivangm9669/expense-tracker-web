document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("expense-form");
  const description = document.getElementById("description");
  const amount = document.getElementById("amount");
  const payer = document.getElementById("payer");
  const category = document.getElementById("category");
  const notes = document.getElementById("notes");
  const submitButton = document.getElementById("split-expense");
  const newUser = document.getElementById("user-name");
  const addUserBtn = document.querySelector(".add-user-btn button");

  let isFormValid = false;

  const expenseList = JSON.parse(localStorage.getItem("expenseList")) || [];
  const userList = JSON.parse(localStorage.getItem("userList")) || [];
  const SettleList = JSON.parse(localStorage.getItem("settleList")) || [];


  const inputs = [description, amount, payer, category];
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      validateField(input);
      updateFormValidity();
    });

    input.addEventListener("blur", () => {
      validateField(input);
      updateFormValidity();
    });
  });

  notes.addEventListener("input", updateCharacterCount);
  form.addEventListener("submit", handleSubmit);
  addUserBtn.addEventListener("click", vaildUserfield);

  function updateCharacterCount() {
    const maxLength = 200;
    const currentLength = notes.value.length;
    const counterElement = notes.nextElementSibling;

    counterElement.textContent = `${currentLength}/${maxLength}`;

    if (maxLength < currentLength) {
      notes.value = notes.value.substring(0, maxLength);
      counterElement.style.color = "var(--error-color)";
    } else {
      counterElement.style.color = "";
    }
  }

  function vaildUserfield(event) {
    event.preventDefault();

    const errorMessage = document.createElement("span");
    errorMessage.classList.add("error-message");

    const userInput = document.getElementById("user-name");
    const userValue = userInput.value.trim();

    const existingError = userInput.nextElementSibling;
    if (existingError && existingError.classList.contains("error-message")) {
      existingError.remove();
    }

    if (userValue === "") {
      errorMessage.textContent = "User name is required.";
      userInput.after(errorMessage);
      return;
    }

    if (userValue.length < 3) {
      errorMessage.textContent = "User name must be at least 3 characters.";
      userInput.after(errorMessage);
      return;
    }

    if (
      userList.some(
        (user) => user.userName.toLowerCase() === userValue.toLowerCase()
      )
    ) {
      errorMessage.textContent = "User name already exists.";
      userInput.after(errorMessage);
      return;
    }

    addUser(userValue);
    userInput.value = "";
  }

  function validateField(field) {
    const errorElement = field.nextElementSibling;
    let isValid = true;
    let errorMessage = "";

    switch (field.id) {
      case "description":
        if (!field.value.trim()) {
          isValid = false;
          errorMessage = "Description is required";
        } else if (field.value.length < 3) {
          isValid = false;
          errorMessage = "Description must be at least 3 characters";
        }
        break;

      case "amount":
        if (!field.value) {
          isValid = false;
          errorMessage = "Amount is required";
        } else if (parseFloat(field.value) <= 0) {
          isValid = false;
          errorMessage = "Amount must be greater than 0";
        }
        break;

      case "payer":
      case "category":
        if (!field.value) {
          isValid = false;
          errorMessage = `Please select a ${field.id}`;
        }
        break;
    }

    field.classList.toggle("invalid", !isValid);
    errorElement.textContent = errorMessage;

    updateFormValidity();
    return isValid;
  }

  function updateSubmitButton() {
    submitButton.disabled = !isFormValid;
  }

  function updateFormValidity() {
    isFormValid = inputs.every((input) => !input.classList.contains("invalid"));
    updateSubmitButton();
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    const expense = {
      description: description.value,
      amount: parseFloat(amount.value),
      payer: payer.value,
      category: category.value,
      notes: notes.value,
    };

    console.log("Expense submitted:", expense);
    expenseList.push(expense);
    localStorage.setItem("expenseList", JSON.stringify(expenseList));
    updateUserAmount(parseFloat(amount.value));
    updateTotalAmount();
    form.reset();
    isFormValid = false;
    updateSubmitButton();
    addCard();

    alert("Expense added successfully!");
  }

  function updateUserAmount(totalAmount) {
    const noOfUsers = userList.length;
    
    if (noOfUsers && noOfUsers > 0) {
      const splitAmount =totalAmount / noOfUsers;
      console.log(splitAmount);

      userList.forEach((user) => {
        console.log(user.amount);
        let currAmount = parseFloat(user.amount);
        currAmount+=parseFloat(splitAmount.toFixed(2));
        console.log(currAmount);
        user.amount= currAmount;
      });

      localStorage.setItem("userList", JSON.stringify(userList));
      showUsers();
    } else {
      console.error("Invalid user count or zero users present.");
    }
  }

  function addCard() {
    const cardId = document.getElementById("expense-card");
    cardId.innerHTML = "";
    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>Description</th>
            <th>Amount</th>
            <th>Payer</th>
            <th>Category</th>
            <th>Notes</th>
            <th>Action</th>
        </tr>
    `;

    expenseList.forEach((expense , index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${expense.description}</td>
            <td>$${expense.amount}</td>
            <td>${expense.payer}</td>
            <td>${expense.category}</td>
            <td>${expense.notes}</td>
            <td><button type="button" class="settle-btn" data-id = "${index}">Settle</button></td>
        `;
      table.appendChild(row);
    });
    cardId.appendChild(table);

    document.querySelectorAll('.settle-btn').forEach((button) => {
        button.addEventListener('click' , function(){
            settleExpense(this.getAttribute('data-id'));
        });
    });
    
  }

  function settleExpense(index) {
    
    const expense = expenseList[index];
    if (!expense) {
      console.error("Expense not found");
      return;
    }
  
    SettleList.push(expense);
    localStorage.setItem("settleList", JSON.stringify(SettleList));
  
    expenseList.splice(index, 1);
    localStorage.setItem("expenseList", JSON.stringify(expenseList));
  
    
    const totalAmount = parseFloat(expense.amount);
    const noOfUsers = userList.length;
    if (noOfUsers > 0) {
      const splitAmount = totalAmount / noOfUsers;
      userList.forEach((user) => {
        user.amount = (parseFloat(user.amount) - parseFloat(splitAmount.toFixed(2))).toFixed(2);
      });
      localStorage.setItem("userList", JSON.stringify(userList));
    }
  
    addCard();
    showUsers();
    updateTotalAmount();
    updateSettleSection();
    alert("Expense settled successfully!");
  }
  

  function addUser() {
    const user = {
      userName: newUser.value,
      amount: 0,
      id: Date.now()
    };


    userList.push(user);
    localStorage.setItem("userList", JSON.stringify(userList));

    showUsers();
    updatePayerDropdown();
  }

  function updatePayerDropdown() {
    const payerDropdown = document.getElementById("payer");

    payerDropdown.innerHTML = `<option value="">Select a payer</option>`;

    userList.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.userName;
      option.textContent = user.userName;
      payerDropdown.appendChild(option);
    });
  }

  function showUsers() {
    const users = document.getElementById("user-list");

    users.innerHTML = "";
    const userSecHead = document.createElement("h2");
    userSecHead.textContent = "Group Member";
    users.appendChild(userSecHead);
    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>User Name</th>
            <th>Amount</th>
            
        </tr>
    `;

    console.log(userList);
    userList.forEach((u) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${u.userName}</td>
            <td>$${u.amount}</td>`
            // <td><button type="button" class="delete-user" data-id="${u.id}">Remove</button>
        ;
      table.appendChild(row);
    });
    users.appendChild(table);

    document.querySelectorAll(".delete-user").forEach((button) => {
      button.addEventListener("click", function () {
        deleteUser(this.getAttribute("data-id"));
      });
    });
  }
  function updateTotalAmount() {
    const totalAmountElement = document.getElementById("total-amount");
    const expenseList = JSON.parse(localStorage.getItem("expenseList")) || [];
  
    const total = expenseList.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
    totalAmountElement.textContent = `$${total.toFixed(2)}`;
  }

  function deleteUser(id) {
    id = parseInt(id);
    const userIndex = userList.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      userList.splice(userIndex, 1);
      localStorage.setItem("userList", JSON.stringify(userList));
      showUsers();
      updatePayerDropdown();
    }
  }

  function updateSettleSection(){
    const settlementList = document.getElementById("settlement-list");
  settlementList.innerHTML = "";

  if (SettleList.length === 0) {
    settlementList.innerHTML = "<p>No expenses recorded yet</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <tr>
      <th>Description</th>
      <th>Amount</th>
      <th>Payer</th>
      <th>Category</th>
      <th>Notes</th>
    </tr>
  `;

  SettleList.forEach((expense) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${expense.description}</td>
      <td>$${expense.amount}</td>
      <td>${expense.payer}</td>
      <td>${expense.category}</td>
      <td>${expense.notes}</td>
    `;
    table.appendChild(row);
  });

  settlementList.appendChild(table);
  }
  
  addCard();
  showUsers();
  updatePayerDropdown();
  updateTotalAmount();
  updateSettleSection();
    // localStorage.clear();
});

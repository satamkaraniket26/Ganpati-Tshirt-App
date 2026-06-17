const API_URL = "https://script.google.com/macros/s/AKfycby8j76otD44v3EkMnVclUIab_3YPCI-fhbrs1N-erdgVrH8p9Njj4EATx5uDZ3_aKQ/exec";

function validateName(input){

  input.value = input.value.replace(/[^a-zA-Z\s]/g, "");

}

const USERS = {
  admin: "admin123",
  aniket: "1234",
  omkar: "1234",
  atul: "1234"
};

const PRICE = 350;

let allBookings = [];

function login() {

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  if (USERS[username] === password) {

    localStorage.setItem("loggedUser", username);

    window.location.href = "dashboard.html";

  } else {

    alert("Invalid Username or Password");

  }
}

function logout() {

  localStorage.clear();

  window.location.href = "index.html";

}

function checkLogin() {

  const user = localStorage.getItem("loggedUser");

  if (!user) {

    alert("Please login first");

    window.location.href = "index.html";

  }
}

function calculate() {

  let qty = 0;

  const sizes = [
    "20", "22", "24", "26", "28", "30",
    "32", "34", "36", "38", "40", "42", "44"
  ];

  sizes.forEach(size => {
    qty += Number(document.getElementById("size" + size).value);
  });

  document.getElementById("totalQty").innerHTML = qty;

  document.getElementById("amount").innerHTML =
    "₹" + (qty * PRICE);
}

function generateReceipt(data, bookingId) {

  let sizes = "";

  const sizeList = [
    "20","22","24","26","28","30",
    "32","34","36","38","40","42","44"
  ];

  sizeList.forEach(size => {

    if(Number(data["size" + size]) > 0){

      sizes +=
        `Size ${size} - ${data["size" + size]}\n`;

    }
  });

  return `श्री. सिद्धिविनायक सार्वजनिक गणेशोत्सव मंडळ
॥ मीरारोडचा महाराजा ॥
स्थापना २००६ | वर्ष २१ वे.

Booking ID: ${bookingId}

Name: ${data.name}

Mobile: ${data.mobile}

Booked Sizes:
${sizes}

T-Shirt Qty: ${data.totalQty}

ID Cards: ${data.idQty}

Amount: ₹${data.amount}

Payment Mode: ${data.paymentMode}

Payment Status: ${data.paymentStatus}

Booked By: ${data.createdBy}

धन्यवाद ||`;
}

async function saveBooking() {

  const totalQty =
    Number(document.getElementById("totalQty").innerHTML);

  let idQty = 0;

if(
  document.getElementById("needId") &&
  document.getElementById("needId").checked
){

    idQty =
    Number(
      document.getElementById("idQty").value || 0
    );
}

const amount =
  (totalQty * 350)
  +
  (idQty * 75);

  const name =
    document.getElementById("name").value.trim();
    if(!/^[A-Za-z\s]+$/.test(name)){

    alert(
    "Customer Name should contain only alphabets"
  );

  return;
}

  const mobile =
    document.getElementById("mobile").value.trim();

  if (name === "") {

    alert("Please enter Customer Name");

    return;
  }

  if (!/^\d{10}$/.test(mobile)) {

    alert("Please enter a valid 10 digit mobile number");

    return;
  }

  if (totalQty === 0) {

    alert("Please select at least one T-Shirt");

    return;
  }

  // Create size object matching Google Sheet structure
  const sizeData = {

    size20: 0,
    size22: 0,
    size24: 0,
    size26: 0,
    size28: 0,
    size30: 0,
    size32: 0,
    size34: 0,
    size36: 0,
    size38: 0,
    size40: 0,
    size42: 0,
    size44: 0
  };

  // Read all dynamic rows
  const rows =
    document.querySelectorAll(".size-row");

  rows.forEach(row => {

    const size =
      row.querySelector(".size-select").value;

    const qty =
      Number(
        row.querySelector(".qty-input").value || 0
      );

    sizeData["size" + size] += qty;
  });

  const data = {
    
    type: "booking",

    name: name,
    mobile: mobile,

    ...sizeData,

    totalQty: totalQty,
    idQty: idQty,

    amount: amount,

    paymentMode:
      document.getElementById("paymentMode").value,

    paymentStatus:
      document.getElementById("paymentStatus").value,

    createdBy:
      localStorage.getItem("loggedUser")
  };

  try {

  const response = await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify(data)
  });

  const result =
    await response.json();

    const receipt =
      generateReceipt(
        data,
        result.bookingId
      );

    if (
      confirm(
        "Booking Saved Successfully!\nBooking ID: " +
        result.bookingId +
        "\n\nOpen WhatsApp Receipt?"
      )
    ) {
      window.location.href =
  `https://wa.me/91${data.mobile}?text=${encodeURIComponent(receipt)}`;
    }

    // Clear customer details
    document.getElementById("name").value = "";
document.getElementById("mobile").value = "";

// Reset dynamic size rows
document.getElementById("sizeContainer").innerHTML = "";

addSizeRow();

// Reset ID Card section
document.getElementById("needId").checked = false;

document.getElementById("idQty").value = 1;

document.getElementById("idSection").style.display = "none";

document.getElementById("paymentMode").selectedIndex = 0;
document.getElementById("paymentStatus").selectedIndex = 0;

calculateDynamic();
  } catch (error) {

  console.error(error);

  alert(
    "ERROR:\n\n" +
    error.message
  );
}
}

async function loadDashboard() {

  document.getElementById("loggedUser").innerText =
    localStorage.getItem("loggedUser");

  const response = await fetch(API_URL);

  const data = await response.json();

  console.log(data);

  allBookings = data; // IMPORTANT

  let totalOrders = data.length - 1;
  let totalIdCards = 0;
  let totalQty = 0;
  let totalCollection = 0;
  let todayOrders = 0;

  const today = new Date();

for (let i = 1; i < data.length; i++) {

    totalQty += Number(data[i][17] || 0);

    totalIdCards += Number(data[i][18] || 0);

    totalCollection += Number(data[i][19] || 0);

    const bookingDate = new Date(data[i][1]);

    if (
        bookingDate.getDate() === today.getDate() &&
        bookingDate.getMonth() === today.getMonth() &&
        bookingDate.getFullYear() === today.getFullYear()
    ) {
        todayOrders++;
    }
}

  document.getElementById("totalOrders").innerText = totalOrders;
  document.getElementById("totalQty").innerText = totalQty;
  document.getElementById("totalIdCards").innerText =  totalIdCards;
  document.getElementById("totalCollection").innerText = "₹" + totalCollection;
  document.getElementById("todayOrders").innerText = todayOrders;
}

async function loadBookings() {

  const response = await fetch(API_URL);

  const data = await response.json();

  allBookings = data;

  renderBookings(data);
}

function renderBookings(data) {

  const tbody =
    document.getElementById("bookingBody");

  tbody.innerHTML = "";

  for (let i = data.length - 1; i >= 1; i--) {

    let actions = `

      <button onclick="viewBooking('${data[i][0]}')">
      View
      </button>

      <button onclick="resendReceipt('${data[i][0]}')">
      Receipt
      </button>

    `;

    if(isAdmin()){

      actions += `

      <button onclick="editBooking('${data[i][0]}')">
      Edit
      </button>

      <button onclick="deleteBooking('${data[i][0]}')">
      Delete
      </button>

      `;
    }

    tbody.innerHTML += `

      <tr>

        <td>${data[i][0]}</td>
        <td>${data[i][2]}</td>
        <td>${data[i][3]}</td>
        <td>${data[i][17]}</td>
        <td>₹${data[i][19]}</td>
        <td>${data[i][21]}</td>
        <td>${data[i][22]}</td>

        <td>${actions}</td>

      </tr>

    `;
  }

  updateSummary(data);
}

function updateSummary(data) {

  let qty = 0;
  let amount = 0;

  for (let i = 1; i < data.length; i++) {

    qty += Number(data[i][17] || 0);
    amount += Number(data[i][19] || 0);
  }

  document.getElementById("totalRecords").innerText =
    data.length - 1;

  document.getElementById("summaryQty").innerText =
    qty;

  document.getElementById("summaryAmount").innerText =
    amount;
}

function applyFilters() {

  const search =
    document.getElementById("searchBox")
      .value
      .toLowerCase();

  const status =
    document.getElementById("statusFilter")
      .value;

  let filtered = [];

  filtered.push(allBookings[0]);

  for (let i = 1; i < allBookings.length; i++) {

    const bookingId =
      String(allBookings[i][0]).toLowerCase();

    const name =
      String(allBookings[i][2]).toLowerCase();

    const mobile =
      String(allBookings[i][3]).toLowerCase();

    const paymentStatus =
      String(allBookings[i][21]);

    const matchesSearch =
      bookingId.includes(search) ||
      name.includes(search) ||
      mobile.includes(search);

    const matchesStatus =
      status === "All" ||
      paymentStatus === status;

    if (matchesSearch && matchesStatus) {

      filtered.push(allBookings[i]);

    }
  }

  renderBookings(filtered);
}

function downloadCSV(){

    if(!allBookings || allBookings.length === 0){

        alert("No booking data loaded.");

        return;
    }

    let csvContent = "";

    allBookings.forEach(row => {

        csvContent += row.join(",") + "\n";

    });

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const link =
        document.createElement("a");

    const url =
        URL.createObjectURL(blob);

    link.href = url;

    const date =
        new Date()
        .toISOString()
        .split("T")[0];

    link.download =
        `GanpatiBookings_${date}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

async function loadSizeReport(){

    const response = await fetch(API_URL);

    const data = await response.json();

    const totals = {
        20:0,
        22:0,
        24:0,
        26:0,
        28:0,
        30:0,
        32:0,
        34:0,
        36:0,
        38:0,
        40:0,
        42:0,
        44:0
    };

    for(let i=1;i<data.length;i++){

        totals[20] += Number(data[i][4] || 0);
        totals[22] += Number(data[i][5] || 0);
        totals[24] += Number(data[i][6] || 0);
        totals[26] += Number(data[i][7] || 0);
        totals[28] += Number(data[i][8] || 0);
        totals[30] += Number(data[i][9] || 0);
        totals[32] += Number(data[i][10] || 0);
        totals[34] += Number(data[i][11] || 0);
        totals[36] += Number(data[i][12] || 0);
        totals[38] += Number(data[i][13] || 0);
        totals[40] += Number(data[i][14] || 0);
        totals[42] += Number(data[i][15] || 0);
        totals[44] += Number(data[i][16] || 0);
    }

    const tbody =
      document.getElementById("sizeReportBody");

    tbody.innerHTML = "";

    Object.keys(totals).forEach(size => {

        tbody.innerHTML += `
            <tr>
                <td>${size}</td>
                <td>${totals[size]}</td>
            </tr>
        `;
    });
}

function viewBooking(bookingId){

  const booking =
    allBookings.find(
      row => String(row[0]) === String(bookingId)
    );

  if(!booking){
    alert("Booking not found");
    return;
  }

  let sizes = "";

  if(Number(booking[4]) > 0) sizes += "Size 20 : " + booking[4] + "\n";
  if(Number(booking[5]) > 0) sizes += "Size 22 : " + booking[5] + "\n";
  if(Number(booking[6]) > 0) sizes += "Size 24 : " + booking[6] + "\n";
  if(Number(booking[7]) > 0) sizes += "Size 26 : " + booking[7] + "\n";
  if(Number(booking[8]) > 0) sizes += "Size 28 : " + booking[8] + "\n";
  if(Number(booking[9]) > 0) sizes += "Size 30 : " + booking[9] + "\n";
  if(Number(booking[10]) > 0) sizes += "Size 32 : " + booking[10] + "\n";
  if(Number(booking[11]) > 0) sizes += "Size 34 : " + booking[11] + "\n";
  if(Number(booking[12]) > 0) sizes += "Size 36 : " + booking[12] + "\n";
  if(Number(booking[13]) > 0) sizes += "Size 38 : " + booking[13] + "\n";
  if(Number(booking[14]) > 0) sizes += "Size 40 : " + booking[14] + "\n";
  if(Number(booking[15]) > 0) sizes += "Size 42 : " + booking[15] + "\n";
  if(Number(booking[16]) > 0) sizes += "Size 44 : " + booking[16] + "\n";

  alert(
`Booking ID : ${booking[0]}

Name : ${booking[2]}

Mobile : ${booking[3]}

Booked Sizes:
${sizes}

Total Qty : ${booking[17]}

ID Cards : ${booking[18]}

Amount : ₹${booking[19]}

Payment Mode : ${booking[20]}

Payment Status : ${booking[21]}

Created By : ${booking[22]}`
  );
}

function resendReceipt(bookingId){

  const booking =
    allBookings.find(
      row => String(row[0]) === String(bookingId)
    );

  if(!booking){
    alert("Booking not found");
    return;
  }

  const msg =

`श्री. सिद्धिविनायक सार्वजनिक गणेशोत्सव मंडळ
        ॥ मीरारोडचा महाराजा ॥
       स्थापना २००६ | वर्ष २१ वे.

Booking ID: ${booking[0]}

Name: ${booking[2]}

T-Shirts: ${booking[17]}

ID Cards: ${booking[18]}

Amount: ₹${booking[19]}

Payment Status: ${booking[21]}

धन्यवाद ||`;

  window.location.href =
    `https://wa.me/91${booking[3]}?text=${encodeURIComponent(msg)}`;
}

function isAdmin(){

    return localStorage.getItem("loggedUser") === "admin";
}

function editBooking(bookingId){

  alert(
    "Edit Booking Feature Coming Soon\n\nBooking ID : " +
    bookingId
  );
}

function deleteBooking(bookingId){

  alert(
    "Delete Booking Feature Coming Soon\n\nBooking ID : " +
    bookingId
  );
}

function addSizeRow(){

  const container =
    document.getElementById("sizeContainer");

  const row =
    document.createElement("div");

  row.className = "size-row";

  row.innerHTML = `

    <select class="size-select"
      onchange="calculateDynamic()">

      <option value="20">20</option>
      <option value="22">22</option>
      <option value="24">24</option>
      <option value="26">26</option>
      <option value="28">28</option>
      <option value="30">30</option>
      <option value="32">32</option>
      <option value="34">34</option>
      <option value="36">36</option>
      <option value="38">38</option>
      <option value="40">40</option>
      <option value="42">42</option>
      <option value="44">44</option>

    </select>

    <input
      type="number"
      min="1"
      value="1"
      class="qty-input"
      onchange="calculateDynamic()">

    <button
      type="button"
      onclick="removeSizeRow(this)">
      X
    </button>

  `;

  container.appendChild(row);

  calculateDynamic();
}

function removeSizeRow(btn){

  const rows =
    document.querySelectorAll(".size-row");

  if(rows.length === 1){

    alert(
      "At least one size row is required."
    );

    return;
  }

  btn.parentElement.remove();

  calculateDynamic();
}

function calculateDynamic(){

  let totalQty = 0;

  document
    .querySelectorAll(".qty-input")
    .forEach(input => {

      totalQty += Number(input.value || 0);

    });

  let idQty = 0;

  if(
    document.getElementById("needId") &&
    document.getElementById("needId").checked
  ){

      idQty =
      Number(
        document.getElementById("idQty").value || 0
      );
  }

  const amount =
    (totalQty * 350) +
    (idQty * 75);

  document.getElementById("totalQty").innerHTML =
    totalQty;

  document.getElementById("amount").innerHTML =
    "₹" + amount;
}


function calculateCustomerTotal(){

  let tshirtQty = 0;

  document
    .querySelectorAll(".custQty")
    .forEach(item => {

      tshirtQty += Number(item.value || 0);

    });

  let idQty = 0;

  if(
    document.getElementById("needId").checked
  ){

      idQty =
      Number(
        document.getElementById("idQty").value || 0
      );
  }

  const totalAmount =
      (tshirtQty * 350) +
      (idQty * 75);

  document.getElementById("custTotalQty")
  .innerHTML = tshirtQty;

  document.getElementById("custAmount")
  .innerHTML = "₹" + totalAmount;
}

function toggleIdSection(){

  const section =
    document.getElementById("idSection");

  if(
    document.getElementById("needId").checked
  ){

      section.style.display = "block";

  }else{

      section.style.display = "none";

      document.getElementById("idQty").value = 1;
  }

  calculateDynamic();
}


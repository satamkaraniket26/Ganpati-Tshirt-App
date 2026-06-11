const API_URL = "https://script.google.com/macros/s/AKfycbzB6jNppBp0mGbMoItO9OVAm_OKOHrh1mPdJXfToGOwhMNHLoUql1qF_ti5tHANS_tG0A/exec";

const USERS = {
  admin: "admin123",
  Aniket: "1234",
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

    window.location.href = "grand-dashboard.html";

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
    "20", "22", "24", "26", "28", "30",
    "32", "34", "36", "38", "40", "42", "44"
  ];

  sizeList.forEach(size => {

    if (Number(data["size" + size]) > 0) {

      sizes += `Size ${size} - ${data["size" + size]}\n`;

    }
  });

  return 
`श्री. सिद्धिविनायक सार्वजनिक गणेशोत्सव मंडळ 
॥ मीरारोडचा महाराजा ॥ 
स्थापना २००६ 
वर्ष २१ वे.

T-Shirt Booking

Booking ID: ${bookingId}

Name: ${data.name}

Mobile: ${data.mobile}

Booked Sizes:
${sizes}

Total Qty: ${data.totalQty}

Amount: ₹${data.amount}

Payment Mode: ${data.paymentMode}

Payment Status: ${data.paymentStatus}

Booked By: ${data.createdBy}

धन्यवाद`;
}

async function saveBooking() {

  const totalQty =
    Number(document.getElementById("totalQty").innerHTML);

  const amount =
    totalQty * PRICE;

  const name =
    document.getElementById("name").value.trim();

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

    name: name,
    mobile: mobile,

    ...sizeData,

    totalQty: totalQty,

    amount: amount,

    paymentMode:
      document.getElementById("paymentMode").value,

    paymentStatus:
      document.getElementById("paymentStatus").value,

    createdBy:
      localStorage.getItem("loggedUser")
  };

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data)
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

    document.getElementById("paymentMode").selectedIndex = 0;
    document.getElementById("paymentStatus").selectedIndex = 0;

    calculateDynamic();

  } catch (error) {

    console.error(error);

    alert(
      "Error while saving booking. Please try again."
    );
  }
}

async function loadDashboard() {

  document.getElementById("loggedUser").innerText =
    localStorage.getItem("loggedUser");

  const response = await fetch(API_URL);

  const data = await response.json();

  allBookings = data; // IMPORTANT

  let totalOrders = data.length - 1;
  let totalQty = 0;
  let totalCollection = 0;
  let paidCollection = 0;
  let pendingCollection = 0;

  for (let i = 1; i < data.length; i++) {

    totalQty += Number(data[i][17] || 0);
    totalCollection += Number(data[i][18] || 0);

    if (
      String(data[i][20]).toLowerCase() === "paid"
    ) {

      paidCollection += Number(data[i][18] || 0);

    } else {

      pendingCollection += Number(data[i][18] || 0);

    }
  }

  document.getElementById("totalOrders").innerText = totalOrders;
  document.getElementById("totalQty").innerText = totalQty;
  document.getElementById("totalCollection").innerText = "₹" + totalCollection;
  document.getElementById("paidCollection").innerText = "₹" + paidCollection;
  document.getElementById("pendingCollection").innerText = "₹" + pendingCollection;
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
        <td>₹${data[i][18]}</td>
        <td>${data[i][20]}</td>
        <td>${data[i][21]}</td>

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
    amount += Number(data[i][18] || 0);
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
      String(allBookings[i][20]);

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

Amount : ₹${booking[18]}

Payment Mode : ${booking[19]}

Payment Status : ${booking[20]}

Created By : ${booking[21]}`
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

`🙏 Ganpati Mandal T-Shirt Booking

Booking ID: ${booking[0]}

Name: ${booking[2]}

Total Qty: ${booking[17]}

Amount: ₹${booking[18]}

Payment Status: ${booking[20]}

Thank You 🙏`;

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

  btn.parentElement.remove();

  calculateDynamic();
}

function calculateDynamic(){

  let totalQty = 0;

  document
    .querySelectorAll(".qty-input")
    .forEach(input => {

      totalQty +=
        Number(input.value || 0);

    });

  document.getElementById("totalQty")
    .innerHTML = totalQty;

  document.getElementById("amount")
    .innerHTML =
      "₹" + (totalQty * PRICE);
}

function addCustomerSizeRow(){

  const container =
    document.getElementById("customerSizeContainer");

  const row =
    document.createElement("div");

  row.className = "size-row";

  row.innerHTML = `

    <select class="custSize">

      <option>20</option>
      <option>22</option>
      <option>24</option>
      <option>26</option>
      <option>28</option>
      <option>30</option>
      <option>32</option>
      <option>34</option>
      <option>36</option>
      <option>38</option>
      <option>40</option>
      <option>42</option>
      <option>44</option>

    </select>

    <input
      type="number"
      class="custQty"
      value="1"
      min="1"
      onchange="calculateCustomerTotal()">

    <button
      type="button"
      onclick="this.parentElement.remove();calculateCustomerTotal();">
      ❌
    </button>

  `;

  container.appendChild(row);

  calculateCustomerTotal();
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

      document.getElementById("idQty").value = 0;

      calculateCustomerTotal();
  }
}

let selectedSizes = {};

function addSelectedSize(size){

    if(selectedSizes[size]){

        selectedSizes[size]++;

    }else{

        selectedSizes[size] = 1;
    }

    updateSizeButtons();

    renderSelectedSizes();

    calculateCustomerTotal();
}

function updateSizeButtons(){

    document
    .querySelectorAll(".size-btn")
    .forEach(btn => {

        const size =
        btn.getAttribute("data-size");

        if(selectedSizes[size]){

            btn.classList.add("selected-size");

        }else{

            btn.classList.remove("selected-size");
        }

    });
}

function renderSelectedSizes(){

    const container =
      document.getElementById("selectedSizes");

    container.innerHTML = "";

    for(const size in selectedSizes){

        container.innerHTML += `

        <div class="selected-card">

            <b>Size ${size}</b>

            <div>

                <button
                onclick="changeQty(${size},-1)">
                -
                </button>

                <span>
                ${selectedSizes[size]}
                </span>

                <button
                onclick="changeQty(${size},1)">
                +
                </button>

                <button
                onclick="removeSize(${size})">
                ❌
                </button>

            </div>

        </div>

        `;
    }
}

function changeQty(size,change){

    selectedSizes[size] += change;

    if(selectedSizes[size] <= 0){

    delete selectedSizes[size];
  }
    updateSizeButtons();

    renderSelectedSizes();

    calculateCustomerTotal();
}

function removeSize(size){

    delete selectedSizes[size];

    updateSizeButtons();

    renderSelectedSizes();

    calculateCustomerTotal();
}

function calculateCustomerTotal(){

    let tshirtQty = 0;

    for(const size in selectedSizes){

        tshirtQty += selectedSizes[size];
    }

    let idQty = 0;

    if(
      document.getElementById("needId").checked
    ){

        idQty =
        Number(
          document.getElementById("idQty").value
        ) || 0;
    }

    const totalAmount =
      (tshirtQty * 350)
      +
      (idQty * 75);

    document.getElementById("custTotalQty")
.innerHTML = tshirtQty;

document.getElementById("summaryIdQty")
.innerHTML = idQty;

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

        calculateCustomerTotal();
    }
}

function continuePayment(){

    localStorage.setItem(
      "selectedSizes",
      JSON.stringify(selectedSizes)
    );

    localStorage.setItem(
      "idQty",
      document.getElementById("needId").checked
      ?
      document.getElementById("idQty").value
      :
      0
    );

    localStorage.setItem(
      "totalAmount",
      document.getElementById("custAmount").innerText
    );

    window.location.href =
      "customer-success.html";
}

async function saveVargani(){

const wing =
document.getElementById("wing").value.trim();

const roomNo =
  document.getElementById("roomNo").value.trim();

const donorName =
  document.getElementById("donorName").value.trim();

const building =
  document.getElementById("building").value.trim();

const mobile =
  document.getElementById("mobile").value.trim();

const amount =
  document.getElementById("amount").value.trim();


// Wing validation (A, B, C1, A-101 etc.)

if(!/^[A-Za-z0-9-]+$/.test(wing)){

  alert("Wing can contain only letters and numbers");

  return;
}


// Room Number validation

if(!/^\d+$/.test(roomNo)){

  alert("Room Number must be numeric");

  return;
}


// Donor Name validation

if(!/^[A-Za-z ]+$/.test(donorName)){

  alert("Donor Name should contain only alphabets");

  return;
}

// Building Name validation

if(!/^[A-Za-z ]+$/.test(building)){

  alert("Building Name should contain only alphabets");

  return;
}

// Mobile validation

if(mobile !== "" && !/^\d{10}$/.test(mobile)){

  alert("Mobile Number must be 10 digits");

  return;
}


// Amount validation

if(!/^\d+$/.test(amount)){

  alert("Amount must be numeric");

  return;
}

const duplicateCheck =
  await fetch(

    API_URL +

    "?action=checkVargani" +

    "&society=" +
    encodeURIComponent(building) +

    "&wing=" +
    encodeURIComponent(wing) +

    "&room=" +
    encodeURIComponent(roomNo)

  );

const duplicateResult =
  await duplicateCheck.json();

if(duplicateResult.exists){

  const proceed =
    confirm(

      "⚠ Entry Already Exists\n\n" +

      "Receipt No: " +

      duplicateResult.receiptNo +

      "\n\nContinue Anyway?"

    );

  if(!proceed){

    return;
  }
}

  const data = {

  type:"vargani",

  wing: wing,

  roomNo: roomNo,

  building: building,

  donorName: donorName,

  mobile: mobile,

  amount: amount,

  status:
    document.getElementById("status").value,

  collectedBy:
    localStorage.getItem("loggedUser")
};

  try{

    const response = await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify(data)
    });

    const result = await response.json();

    const receipt =

`श्री. सिद्धिविनायक सार्वजनिक गणेशोत्सव मंडळ 
॥ मीरारोडचा महाराजा ॥ 
स्थापना २००६ 
वर्ष २१ वे.

Receipt No: ${result.receiptNo}

Received With Thanks From

Name : ${data.donorName}

Wing: ${data.wing}

Room: ${data.roomNo}

Building: ${data.building}

Amount : ₹${data.amount}

Status: ${data.status}

Collected By:
${data.collectedBy}

धन्यवाद`;

    if(
      data.mobile &&
      /^\d{10}$/.test(data.mobile)
    ){

      if(confirm(
        "Collection Saved Successfully!\n\nOpen WhatsApp Receipt?"
      )){

        window.location.href = 
        `https://wa.me/91${data.mobile}?text=${encodeURIComponent(receipt)}`;
      }
    }

    alert(
      "Collection Saved Successfully!\nReceipt No: " +
      result.receiptNo
    );

    // Clear form

    document.getElementById("wing").value = "";
    document.getElementById("roomNo").value = "";
    document.getElementById("building").value = "";
    document.getElementById("donorName").value = "";
    document.getElementById("mobile").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("status").selectedIndex = 0;

  }catch(error){

    console.error(error);

    alert("Error Saving Collection");
  }
}

async function loadVargani(){

  const response =
    await fetch(
      API_URL + "?sheet=Vargani"
    );

  const data =
    await response.json();

  const search =
    document.getElementById("searchBox")
    .value
    .toLowerCase();

  const status =
    document.getElementById("statusFilter")
    .value;

  let html = "";

  for(let i = data.length - 1; i >= 1; i--){

    const row = data[i];

    const matchesSearch =

      String(row[5]).toLowerCase().includes(search) ||

      String(row[3]).toLowerCase().includes(search) ||

      String(row[4]).toLowerCase().includes(search);

    const matchesStatus =

      status === "" ||

      row[8] === status;

    if(matchesSearch && matchesStatus){

      html += `
      <tr>
        <td>${row[0]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[5]}</td>
        <td>₹${row[7]}</td>
        <td>
          <span class="${getStatusClass(row[8])}">
           ${row[8]}
          </span>
        </td>
        <td>${row[9]}</td>
      </tr>
      `;
    }
  }

  document.getElementById(
    "varganiBody"
  ).innerHTML = html;
}

async function loadPendingVargani(){

  const response =
    await fetch(
      API_URL + "?sheet=Vargani"
    );

  const data =
    await response.json();

  let html = "";

  let pending = 0;
  let revisit = 0;
  let closed = 0;

  for(let i=data.length-1;i>=1;i--){

    const row = data[i];

    const status =
      String(row[8]);

    if(
      status === "Pending" ||
      status === "Revisit" ||
      status === "House Closed"
    ){

      if(status === "Pending")
        pending++;

      if(status === "Revisit")
        revisit++;

      if(status === "House Closed")
        closed++;

      html += `
      <tr>
        <td>${row[0]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[5]}</td>
        <td>${row[8]}</td>
        <td>${row[9]}</td>
      </tr>
      `;
    }
  }

  document.getElementById(
    "pendingBody"
  ).innerHTML = html;

  document.getElementById(
    "pendingCount"
  ).innerText = pending;

  document.getElementById(
    "revisitCount"
  ).innerText = revisit;

  document.getElementById(
    "closedCount"
  ).innerText = closed;
}

async function saveExpense(){

  const vendorName =
    document.getElementById(
      "vendorName"
    ).value.trim();

  const amount =
    document.getElementById(
      "expenseAmount"
    ).value.trim();

  if(vendorName === ""){

    alert("Enter Vendor Name");

    return;
  }

  if(!/^\d+$/.test(amount)){

    alert("Amount must be numeric");

    return;
  }

  const data = {

    type:"expense",

    category:
      document.getElementById(
        "expenseCategory"
      ).value,

    vendorName:
      vendorName,

    amount:
      amount,

    remarks:
      document.getElementById(
        "expenseRemarks"
      ).value,

    addedBy:
      localStorage.getItem(
        "loggedUser"
      )
  };

  try{

    const response =
      await fetch(API_URL,{
        method:"POST",
        body:JSON.stringify(data)
      });

    const result =
      await response.json();

    alert(
      "Expense Saved!\nExpense ID: " +
      result.expenseId
    );

    document.getElementById(
      "vendorName"
    ).value = "";

    document.getElementById(
      "expenseAmount"
    ).value = "";

    document.getElementById(
      "expenseRemarks"
    ).value = "";

  }catch(error){

    console.error(error);

    alert("Error Saving Expense");
  }
}

async function loadExpenses(){

  const response =
    await fetch(
      API_URL + "?sheet=Expenses"
    );

  const data =
    await response.json();

  const search =
    document.getElementById("expenseSearch")
    .value
    .toLowerCase();

  const category =
    document.getElementById(
      "expenseCategoryFilter"
    ).value;

  let html = "";

  let totalExpense = 0;

  for(let i=data.length-1;i>=1;i--){

    const row = data[i];

    const vendor =
      String(row[3] || "")
      .toLowerCase();

    const remarks =
      String(row[5] || "")
      .toLowerCase();

    const matchesSearch =

      vendor.includes(search) ||

      remarks.includes(search);

    const matchesCategory =

      category === "" ||

      row[2] === category;

    if(matchesSearch && matchesCategory){

      totalExpense +=
        Number(row[4] || 0);

      html += `
      <tr>
        <td>${row[0]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>₹${row[4]}</td>
        <td>${row[5]}</td>
        <td>${row[6]}</td>
      </tr>
      `;
    }
  }

  document.getElementById(
    "expenseBody"
  ).innerHTML = html;

  document.getElementById(
    "expenseTotal"
  ).innerText =
    "₹" + totalExpense;
}

// ==========================
// STATUS COLORS
// ==========================

function getStatusClass(status){

  switch(status){

    case "Collected":
      return "status-collected";

    case "Pending":
      return "status-pending";

    case "Revisit":
      return "status-revisit";

    case "Locked":
      return "status-locked";

    case "Refused":
      return "status-refused";

    default:
      return "";
  }
}

async function loadVolunteerDashboard(){

  const response =
    await fetch(
      API_URL + "?sheet=Vargani"
    );

  const data =
    await response.json();

  const volunteers = {};

  for(let i=1;i<data.length;i++){

    const collector =
      data[i][9];

    const amount =
      Number(data[i][7] || 0);

    const status =
      data[i][8];

    if(status !== "Collected")
      continue;

    if(!volunteers[collector]){

      volunteers[collector] = {

        amount:0,
        count:0
      };
    }

    volunteers[collector].amount += amount;

    volunteers[collector].count++;
  }

  let html = "";

  Object.keys(volunteers)

    .sort((a,b)=>

      volunteers[b].amount -

      volunteers[a].amount

    )

    .forEach(name=>{

      html += `
      <tr>
        <td>${name}</td>
        <td>₹${volunteers[name].amount}</td>
        <td>${volunteers[name].count}</td>
      </tr>
      `;
    });

  document.getElementById(
    "volunteerBody"
  ).innerHTML = html;
}

async function savePolitical(){

  const data = {

    type:"political",

    leaderName:
      document.getElementById("leaderName").value,

    party:
      document.getElementById("party").value,

    mobile:
      document.getElementById("mobile").value,

    amount:
      document.getElementById("amount").value,

    remarks:
      document.getElementById("remarks").value,

    collectedBy:
      localStorage.getItem("loggedUser")
  };

  const response =
    await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify(data)
    });

  const result =
    await response.json();

  alert(
    "Political Donation Saved\nReceipt No : " +
    result.receiptNo
  );
}

async function saveVendor(){

  const data = {

    type:"vendor",

    shopName:
      document.getElementById("shopName").value,

    ownerName:
      document.getElementById("ownerName").value,

    mobile:
      document.getElementById("mobile").value,

    address:
      document.getElementById("address").value,

    amount:
      document.getElementById("amount").value,

    collectedBy:
      localStorage.getItem("loggedUser")
  };

  const response =
    await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify(data)
    });

  const result =
    await response.json();

  alert(
    "Vendor Donation Saved\nReceipt No : " +
    result.receiptNo
  );
}

async function loadGrandDashboard(){

  const bookings =
    await fetch(
      API_URL + "?sheet=Bookings"
    ).then(r=>r.json());

  const vargani =
    await fetch(
      API_URL + "?sheet=Vargani"
    ).then(r=>r.json());

  const political =
    await fetch(
      API_URL + "?sheet=Political"
    ).then(r=>r.json());

  const vendor =
    await fetch(
      API_URL + "?sheet=Vendor"
    ).then(r=>r.json());

  const expenses =
    await fetch(
      API_URL + "?sheet=Expenses"
    ).then(r=>r.json());

  let tshirtTotal = 0;
  let varganiTotal = 0;
  let politicalTotal = 0;
  let vendorTotal = 0;
  let expenseTotal = 0;

  const volunteers = {};

  // BOOKINGS
  for(let i=1;i<bookings.length;i++){

    tshirtTotal +=
      Number(bookings[i][18] || 0);
  }

  // VARGANI
  for(let i=1;i<vargani.length;i++){

    const amount =
      Number(vargani[i][7] || 0);

    if(vargani[i][8] === "Collected"){

      varganiTotal += amount;

      const collector =
        vargani[i][9];

      if(!volunteers[collector]){

        volunteers[collector] = 0;
      }

      volunteers[collector] += amount;
    }
  }

  // POLITICAL
  for(let i=1;i<political.length;i++){

    politicalTotal +=
      Number(political[i][5] || 0);
  }

  // VENDOR
  for(let i=1;i<vendor.length;i++){

    vendorTotal +=
      Number(vendor[i][6] || 0);
  }

  // EXPENSES
  for(let i=1;i<expenses.length;i++){

    expenseTotal +=
      Number(expenses[i][4] || 0);
  }

  const incomeTotal =
    tshirtTotal +
    varganiTotal +
    politicalTotal +
    vendorTotal;

  const balance =
    incomeTotal -
    expenseTotal;

  let topVolunteer = "-";
  let highest = 0;

  Object.keys(volunteers)
    .forEach(name=>{

      if(volunteers[name] > highest){

        highest =
          volunteers[name];

        topVolunteer =
          name;
      }
    });

  document.getElementById(
    "tshirtTotal"
  ).innerText =
    "₹" + tshirtTotal;

  document.getElementById(
    "varganiTotal"
  ).innerText =
    "₹" + varganiTotal;

  document.getElementById(
    "politicalTotal"
  ).innerText =
    "₹" + politicalTotal;

  document.getElementById(
    "vendorTotal"
  ).innerText =
    "₹" + vendorTotal;

  document.getElementById(
    "incomeTotal"
  ).innerText =
    "₹" + incomeTotal;

  document.getElementById(
    "expenseTotal"
  ).innerText =
    "₹" + expenseTotal;

  document.getElementById(
    "balanceTotal"
  ).innerText =
    "₹" + balance;

  document.getElementById(
    "topVolunteer"
  ).innerText =
    topVolunteer;
}

async function loadPolitical(){

  const response =
    await fetch(
      API_URL + "?sheet=Political"
    );

  const data =
    await response.json();

  const search =
    document.getElementById(
      "politicalSearch"
    ).value.toLowerCase();

  let html = "";

  for(let i=data.length-1;i>=1;i--){

    const leader =
      String(data[i][2] || "")
      .toLowerCase();

    const party =
      String(data[i][3] || "")
      .toLowerCase();

    if(
      leader.includes(search) ||
      party.includes(search)
    ){

      html += `
      <tr>
        <td>${data[i][0]}</td>
        <td>${data[i][2]}</td>
        <td>${data[i][3]}</td>
        <td>₹${data[i][5]}</td>
        <td>${data[i][7]}</td>
      </tr>
      `;
    }
  }

  document.getElementById(
    "politicalBody"
  ).innerHTML = html;
}

async function loadVendor(){

  const response =
    await fetch(
      API_URL + "?sheet=Vendor"
    );

  const data =
    await response.json();

  const search =
    document.getElementById(
      "vendorSearch"
    ).value.toLowerCase();

  let html = "";

  for(let i=data.length-1;i>=1;i--){

    const shop =
      String(data[i][2] || "")
      .toLowerCase();

    const owner =
      String(data[i][3] || "")
      .toLowerCase();

    if(
      shop.includes(search) ||
      owner.includes(search)
    ){

      html += `
      <tr>
        <td>${data[i][0]}</td>
        <td>${data[i][2]}</td>
        <td>${data[i][3]}</td>
        <td>₹${data[i][6]}</td>
        <td>${data[i][7]}</td>
      </tr>
      `;
    }
  }

  document.getElementById(
    "vendorBody"
  ).innerHTML = html;
}

async function universalSearch(){

  const search =
    document.getElementById(
      "searchText"
    ).value.toLowerCase();

  let html = "";

  // BOOKINGS

  const bookings =
    await fetch(
      API_URL + "?sheet=Bookings"
    ).then(r=>r.json());

  for(let i=1;i<bookings.length;i++){

    const row =
      JSON.stringify(bookings[i])
      .toLowerCase();

    if(row.includes(search)){

      html += `
      <div class="search-card">

      <h3>👕 Booking</h3>

      <p>
      ${bookings[i][2]}
      </p>

      <p>
      ${bookings[i][3]}
      </p>

      <p>
      ₹${bookings[i][18]}
      </p>

      </div>
      `;
    }
  }

  // VARGANI

  const vargani =
    await fetch(
      API_URL + "?sheet=Vargani"
    ).then(r=>r.json());

  for(let i=1;i<vargani.length;i++){

    const row =
      JSON.stringify(vargani[i])
      .toLowerCase();

    if(row.includes(search)){

      html += `
      <div class="search-card">

      <h3>🏠 Vargani</h3>

      <p>
      ${vargani[i][5]}
      </p>

      <p>
      Receipt :
      ${vargani[i][0]}
      </p>

      <p>
      ₹${vargani[i][7]}
      </p>

      </div>
      `;
    }
  }

  // POLITICAL

  const political =
    await fetch(
      API_URL + "?sheet=Political"
    ).then(r=>r.json());

  for(let i=1;i<political.length;i++){

    const row =
      JSON.stringify(political[i])
      .toLowerCase();

    if(row.includes(search)){

      html += `
      <div class="search-card">

      <h3>🏛 Political</h3>

      <p>
      ${political[i][2]}
      </p>

      <p>
      ₹${political[i][5]}
      </p>

      </div>
      `;
    }
  }

  // VENDOR

  const vendor =
    await fetch(
      API_URL + "?sheet=Vendor"
    ).then(r=>r.json());

  for(let i=1;i<vendor.length;i++){

    const row =
      JSON.stringify(vendor[i])
      .toLowerCase();

    if(row.includes(search)){

      html += `
      <div class="search-card">

      <h3>🏪 Vendor</h3>

      <p>
      ${vendor[i][2]}
      </p>

      <p>
      ₹${vendor[i][6]}
      </p>

      </div>
      `;
    }
  }

  if(html === ""){

    html = `
    <div class="search-card">

    No Records Found

    </div>
    `;
  }

  document.getElementById(
    "searchResults"
  ).innerHTML = html;
}
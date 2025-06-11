import { showModal } from "./utilities.js";

// Function to display the login form
export function displayLoginForm(body) {
  const loginForm = document.createElement("form");
  loginForm.id = "login-form";
  loginForm.innerHTML = `
    <h1>Login</h1>
    <label for="username">Username or email</label>
    <input type="text" id="username" name="username" required />
    <label for="password">Password</label>
    <input type="password" id="password" name="password" required />
    <button type="submit">Login</button>
  `;
  body.appendChild(loginForm);

  const modal = document.getElementById("modal");
  const modalMessage = document.getElementById("modal-message");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch(
        "https://learn.reboot01.com/api/auth/signin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      if (!response.ok) {
        showModal(
          modal,
          modalMessage,
          `Request failed with status ${response.status}. Please try again.`,
          false
        );
        loginForm.reset();
        return;
      }

      const jwtStr = await response.text();
      const jwt = jwtStr.replace(/"/g, "");
      localStorage.setItem("jwt", jwt);
      location.reload();
    } catch (error) {
      // Handle network errors or other exceptions
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        showModal(
          modal,
          modalMessage,
          "Network error. Please check your internet connection.",
          false
        );
      } else {
        showModal(
          modal,
          modalMessage,
          "An unexpected error occurred. Please try again.",
          false
        );
      }
      console.error("Login error:", error);
      loginForm.reset();
    }
  });
}

// Function to create profile content
export function displayProfile(body, userData, totalXP, totalAudits) {
  const navBar = document.createElement("nav");
  navBar.id = "nav-bar";

  const navTitle = document.createElement("h1");
  navTitle.textContent = `Welcome ${userData.firstName} ${userData.lastName} (${userData.login})`;
  navBar.appendChild(navTitle);

  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.id = "logout-button";
  logoutButton.className = "btn btn-danger";

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("jwt");
    location.reload();
  });

  navBar.appendChild(logoutButton);
  body.insertBefore(navBar, body.firstChild);

  const container = document.createElement("div");
  container.id = "container";
  body.appendChild(container);

  container.innerHTML = `
    <div class="user-info">
      <h2>Your activity</h2>
      <p>You created your account on: ${new Date(
        userData.createdAt
      ).toLocaleDateString()}</p>
      <p>Module XP earned: <span style="color: var(--primary);">${totalXP}</span> kB</p>
      <p>Audits you have done: <span style="color: var(--primary);">${totalAudits}</span></p>
    </div>
    <div class="user-objects">
      <h2>Your activities</h2>
      <div class="object-stat"></div>
    </div>
    <div class="user-xp">
      <h2>XP over time</h2>
      <div class="xp-stat"></div>
    </div>
  `;
}

export function displayXPStats(xpStat, transactions) {
  const svgNamespace = "http://www.w3.org/2000/svg";

  // Group transactions by month and calculate total XP per month
  const xpByMonth = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.createdAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`; 
    acc[month] = (acc[month] || 0) + transaction.amount;
    return acc;
  }, {});

  // Determine the range of months
  const allMonths = [];
  const firstDate = new Date(
    Math.min(...transactions.map((t) => new Date(t.createdAt)))
  );
  const lastDate = new Date(
    Math.max(...transactions.map((t) => new Date(t.createdAt)))
  );
  // Set currentDate to the first day of the first month
  let currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

  // Set lastDate to the first day of the last month for consistent comparison
  const lastMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

  while (currentDate <= lastMonth) {
    const month = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;
    allMonths.push(month);
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
  }

  // Fill in missing months with 0 XP
  const data = allMonths.map((month) => ({
    month,
    xp: xpByMonth[month] || 0,
  }));

  // Create the SVG element
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("xp-chart");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", "0 0 510 350");
  svg.setAttribute(
    "style",
    "background-color: var(--light-background); border-radius: 8px;"
  );

  // Calculate scaling factors
  const maxXP = Math.max(...data.map((d) => d.xp));
  const barWidth = 500 / data.length;
  const yScale = (xp) => (xp / maxXP) * 200;

  // Draw bars
  data.forEach((d, index) => {
    const barHeight = yScale(d.xp);
    const rect = document.createElementNS(svgNamespace, "rect");
    rect.setAttribute("x", index * barWidth + 10);
    rect.setAttribute("y", 300 - barHeight - 10);
    rect.setAttribute("width", barWidth - 5);
    rect.setAttribute("height", barHeight);
    rect.setAttribute("fill", "var(--primary)");
    svg.appendChild(rect);

    // Add month labels (top line)
    const [year, month] = d.month.split("-");
    const monthLabel = document.createElementNS(svgNamespace, "text");
    monthLabel.setAttribute("x", index * barWidth + barWidth / 2 + 7);
    monthLabel.setAttribute("y", 310);
    monthLabel.setAttribute("text-anchor", "middle");
    monthLabel.setAttribute("font-size", "12");
    monthLabel.setAttribute("fill", "var(--danger)");
    monthLabel.textContent = parseInt(month, 10);
    svg.appendChild(monthLabel);

    // Add XP value labels
    const xpLabel = document.createElementNS(svgNamespace, "text");
    xpLabel.setAttribute("x", index * barWidth + barWidth / 2 + 8);
    xpLabel.setAttribute("y", 300 - barHeight - 15);
    xpLabel.setAttribute("text-anchor", "middle");
    xpLabel.setAttribute("font-size", "10");
    xpLabel.setAttribute("fill", "var(--text)");
    xpLabel.textContent = Math.round(d.xp / 1000) + "kB";
    svg.appendChild(xpLabel);
  });

  // Add year labels with lines (bottom)
  let currentYear = null;
  let yearStartIndex = 0;

  data.forEach((d, index) => {
    const [year] = d.month.split("-");

    if (currentYear !== year) {
      if (currentYear !== null) {
        const yearEndIndex = index - 1;
        const yearStartX = yearStartIndex * barWidth + barWidth / 2;
        const yearEndX = yearEndIndex * barWidth + barWidth / 2;
        const yearCenterX = (yearStartX + yearEndX) / 2;

        // Year label
        const yearLabel = document.createElementNS(svgNamespace, "text");
        yearLabel.setAttribute("x", yearCenterX);
        yearLabel.setAttribute("y", 330);
        yearLabel.setAttribute("text-anchor", "middle");
        yearLabel.setAttribute("font-size", "12");
        yearLabel.setAttribute("fill", "var(--primary)");
        yearLabel.textContent = currentYear;
        svg.appendChild(yearLabel);

        // Year line
        const yearLine = document.createElementNS(svgNamespace, "line");
        yearLine.setAttribute("x1", yearStartX);
        yearLine.setAttribute("y1", 315);
        yearLine.setAttribute("x2", yearEndX + 15);
        yearLine.setAttribute("y2", 315);
        yearLine.setAttribute("stroke", "var(--primary)");
        yearLine.setAttribute("stroke-width", "1");
        svg.appendChild(yearLine);
      }

      currentYear = year;
      yearStartIndex = index;
    }

    // Handle the last year
    if (index === data.length - 1) {
      const yearStartX = yearStartIndex * barWidth + barWidth / 2;
      const yearEndX = index * barWidth + barWidth / 2;
      const yearCenterX = (yearStartX + yearEndX) / 2;

      // Year label
      const yearLabel = document.createElementNS(svgNamespace, "text");
      yearLabel.setAttribute("x", yearCenterX);
      yearLabel.setAttribute("y", 330);
      yearLabel.setAttribute("text-anchor", "middle");
      yearLabel.setAttribute("font-size", "12");
      yearLabel.setAttribute("fill", "var(--primary)");
      yearLabel.textContent = currentYear;
      svg.appendChild(yearLabel);

      // Year line
      const yearLine = document.createElementNS(svgNamespace, "line");
      yearLine.setAttribute("x1", yearStartX);
      yearLine.setAttribute("y1", 315);
      yearLine.setAttribute("x2", yearEndX + 15);
      yearLine.setAttribute("y2", 315);
      yearLine.setAttribute("stroke", "var(--primary)");
      yearLine.setAttribute("stroke-width", "1");
      svg.appendChild(yearLine);
    }
  });

  // Append the SVG to the container
  xpStat.appendChild(svg);
}

export function displayObjStats(container, objects) {
  const svgNamespace = "http://www.w3.org/2000/svg";

  // Process event data to group by type
  const typeCounts = objects.reduce((acc, event) => {
    const type = event.event.object.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totalEvents = Object.values(typeCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const pieData = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: (count / totalEvents) * 100,
  }));

  // Create SVG for pie chart
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("object-chart");
  svg.setAttribute("width", "300");
  svg.setAttribute("height", "300");
  svg.setAttribute("viewBox", "0 0 300 300");

  const radius = 150;
  const centerX = 150;
  const centerY = 150;
  let startAngle = 0;

  pieData.forEach((data) => {
    const sliceAngle = (data.percentage / 100) * 2 * Math.PI;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(startAngle + sliceAngle);
    const y2 = centerY + radius * Math.sin(startAngle + sliceAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const pathData = `
      M ${centerX} ${centerY}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "var(--primary)");
    path.setAttribute("stroke", "var(--light-background)");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);

    // Calculate label position 
    const midAngle = startAngle + sliceAngle / 2;
    const labelX = centerX + (radius / 1.5) * Math.cos(midAngle); 
    const labelY = centerY + (radius / 1.5) * Math.sin(midAngle);

    // Add label for the slice
    const label = document.createElementNS(svgNamespace, "text");
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "var(--text)");
    label.textContent = `${data.type} (${data.count})`; 
    svg.appendChild(label);

    startAngle += sliceAngle;
  });

  // Append SVG to the container
  container.appendChild(svg);
}


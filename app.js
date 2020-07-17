let user;
let uid;
let taskListPage;
const priorityBtn = document.getElementById("addPriority");
const priorityMenu = document.getElementById("priority-dropdown");

class Task {
  constructor(id, title, sortKey = 0, priorityId, uid) {
    this.id = id; // firebase key (randomized)
    this.title = title;
    this.sortKey = 0;
    this.priorityId = priorityId;
    this.uid = uid;
  }
}

class TaskListPage {
  constructor() {
    this.tasks = [];
    this.priorities = [];

    firebase
      .database()
      .ref("priorities")
      .once("value", (prioritiesSnapshot) => {
        const allPriorities = prioritiesSnapshot.val();
        Object.keys(allPriorities).forEach((priorityId) => {
          const priorityData = allPriorities[priorityId];
          const priority = {
            id: priorityId,
            name: priorityData.name,
            color: priorityData.color,
          };
          this.priorities.push(priority);
        });
      });

    firebase
      .database()
      .ref("tasks")
      .once("value", (snapshot) => {
        const allTasks = snapshot.val();
        Object.keys(allTasks).forEach((taskId) => {
          const taskData = allTasks[taskId];
          const task = new Task(
            taskId,
            taskData.title,
            taskData.sortKey,
            taskData.priorityId
          );
          //console.log(task.priorityId);

          if (taskData.priorityId) {
            const priority = this.priorities.find(
              (priority) => priority.id == taskData.priorityId
            );
            task.priorityId = priority;
          }

          this.tasks.push(task);

          const taskListElement = document.getElementById("taskList");
          const row = document.createElement("tr");
          row.setAttribute("data-task-id", task.id);
          //console.log(task.id);
          row.innerHTML = `
          <td>${task.title}</td>
          <td>
          <button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button>
          <button data-action="delete" data-task-id="${task.id}" class="btn btn-danger">Delete</button>
          <button class="btn btn-outline-info dropdown-toggle" type="button" id="priorityBtn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Priority
          </button>
          <div class="dropdown-menu" aria-labelledby="priorityBtn">
          <button class="dropdown-item" data-action="priority" data-task-id="${task.id}" data-task-priority="high" type="button">High</button>
          <button class="dropdown-item" data-action="priority" data-task-id="${task.id}" data-task-priority="medium" type="button">Medium</button>
          <button class="dropdown-item" data-action="priority" data-task-id="${task.id}" data-task-priority="low" type="button">Low</button>
          </div>
          </td>
          `;
          console.log(task.priorityId);
          if (task.priorityId) {
            if (task.priorityId.id == "H") {
              row.setAttribute("class", "table-danger");
            } else if (task.priorityId.id == "M") {
              row.setAttribute("class", "table-warning");
            } else if (task.priorityId.id == "L") {
              row.setAttribute("class", "table-success");
            }
          }
          taskListElement.appendChild(row);
        });
      });
  }

  addTask(title, priorityId, uid) {
    const sortKey = this.tasks.length + 1;
    const newTaskSnapshot = firebase.database().ref("tasks").push({
      title: title,
      sortKey: sortKey,
/*       priorityId: priorityId,
      uid: uid */
    });
    const taskId = newTaskSnapshot.key;

    //const taskId = this.tasks.length + 1;
    console.log(uid);
    const task = new Task(taskId, title, sortKey, priorityId, uid);
    this.tasks.push(task);

    const taskListElement = document.getElementById("taskList");
    const row = document.createElement("tr");
    row.setAttribute("data-task-id", task.id);
    row.innerHTML = `
      <td>${task.title}</td>
      <td>
      <button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button>
      <button data-action="delete" data-task-id="${task.id}" class="btn btn-danger">Delete</button>
      <button class="btn btn-outline-info dropdown-toggle" type="button" id="priorityBtn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      Priority
      </button>
      <div class="dropdown-menu" aria-labelledby="priorityBtn">
      <button class="dropdown-item" data-action="priority" data-task-id="${task.id}" data-task-priority="high" type="button">High</button>
      <button class="dropdown-item" data-action="priority" data-task-id="${task.id}" data-task-priority="medium" type="button">Medium</button>
      <button class="dropdown-item" data-action="priority" data-task-id="${task.id}" data-task-priority="low" type="button">Low</button>
      </div>
      </td>
      `;

    if (priorityId == "H") {
      row.setAttribute("class", "table-danger");
      firebase
        .database()
        .ref("tasks")
        .child(taskId)
        .update({ priorityId: "H" });
    } else if (priorityId == "M") {
      row.setAttribute("class", "table-warning");
      firebase
        .database()
        .ref("tasks")
        .child(taskId)
        .update({ priorityId: "M" });
    } else if (priorityId == "L") {
      row.setAttribute("class", "table-success");
      firebase
        .database()
        .ref("tasks")
        .child(taskId)
        .update({ priorityId: "L" });
    }
    taskListElement.appendChild(row);
    firebase.database().ref("tasks").child(taskId).set({
      title: title,
      id: taskId,
      //priority: task.
      priorityId: priorityId,
      uid: uid
    });
    document.getElementById("task").value = "";
  }

  startEdittingTask(taskId) {
    for (let k = 0; k < this.tasks.length; k++) {
      if (this.tasks[k].id == taskId) {
        const task = this.tasks[k];

        const taskInputElement = document.getElementById("task");
        taskInputElement.value = task.title;
        taskInputElement.setAttribute("data-task-id", task.id);
        document.getElementById("addBtn").innerText = "Save";
      }
    }
  }

  saveTaskTitle(taskId, taskTitle) {
    const task = this.tasks.find((task) => task.id == taskId);
    if (!task) return;

    task.title = taskTitle;
    firebase.database().ref("tasks").child(taskId).set(task); // same as firebase.database().ref('tasks'/ + taskId)

    const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
    if (!existingRow) return;

    existingRow.children[0].innerHTML = task.title;
    const taskInput = document.getElementById("task");
    taskInput.removeAttribute("data-task-id");
    taskInput.value = "";
    document.getElementById("addBtn").innerText = "Add";
  }

  delete(taskId) {
    const task = this.tasks.find((task) => task.id == taskId); // return the first element; use filter((task) => tasks.sortKey == 5) if looking for an array
    if (!task) return;

    firebase.database().ref("tasks").child(taskId).remove();

    const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
    if (!existingRow) return;
    existingRow.remove();
  }

  setPriority(taskId, priority) {
    const task = this.tasks.find((task) => task.id == taskId); // return the first element; use filter((task) => tasks.sortKey == 5) if looking for an array
    if (!task) return;

    const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
    if (priority == "high") {
      existingRow.setAttribute("class", "table-danger");
      firebase
        .database()
        .ref("tasks")
        .child(taskId)
        .update({ priorityId: "H" });
    } else if (priority == "medium") {
      existingRow.setAttribute("class", "table-warning");
      firebase
        .database()
        .ref("tasks")
        .child(taskId)
        .update({ priorityId: "M" });
    } else if (priority == "low") {
      existingRow.setAttribute("class", "table-success");
      firebase
        .database()
        .ref("tasks")
        .child(taskId)
        .update({ priorityId: "L" });
    }
  }
}

// Set priority
// const taskListPage = new TaskListPage();
priorityMenu.addEventListener("click", (e) => {
  console.log(e.target.innerText);
  if (e.target.innerText == "High") {
    priorityBtn.textContent = "High";
  } else if (e.target.innerText == " Medium") {
    priorityBtn.textContent = "Medium";
  } else if (e.target.innerText == "Low") {
    priorityBtn.textContent = "Low";
  }
});

//Switch to register page
document.getElementById("register-btn").addEventListener("click", function (e) {
  document.getElementById("login-page").setAttribute("class", "card d-none");
  document
    .getElementById("registration-page")
    .setAttribute("class", "card d-block");
});

//Switch back to login
document
  .getElementById("back-to-login")
  .addEventListener("click", function (e) {
    document.getElementById("login-page").setAttribute("class", "card d-block");
    document
      .getElementById("registration-page")
      .setAttribute("class", "card d-none");
  });

// Add/submit edited task to the list
document.getElementById("addBtn").addEventListener("click", (e) => {
  const taskInputElement = document.getElementById("task");
  const taskTitle = taskInputElement.value;

  let priority;
  if (priorityBtn.textContent == "High") {
    priority = "H";
  } else if (priorityBtn.textContent == "Medium") {
    priority = "M";
  } else if (priorityBtn.textContent == "Low") {
    priority = "L";
  }

  const existingTaskId = taskInputElement.getAttribute("data-task-id");
  if (existingTaskId) {
    taskListPage.saveTaskTitle(existingTaskId, taskTitle);
  } else {
    taskListPage.addTask(taskTitle, priority, uid);
  }
});

// Edit/delite/change priority of task
document.getElementById("taskList").addEventListener("click", (e) => {
  const action = e.target.getAttribute("data-action");
  if (action == "edit") {
    const taskId = e.target.getAttribute("data-task-id");
    console.log(taskId);
    taskListPage.startEdittingTask(taskId);
  } else if (action == "delete") {
    const taskId = e.target.getAttribute("data-task-id");
    taskListPage.delete(taskId);
  } else if (action == "priority") {
    const taskId = e.target.getAttribute("data-task-id");
    const priority = e.target.getAttribute("data-task-priority");
    taskListPage.setPriority(taskId, priority);
  }
});

// Login
document.getElementById("login-btn").addEventListener("click", (e) => {
  const emailElement = document.getElementById("login-email");
  const passwordElement = document.getElementById("login-password");
  const email = emailElement.value;
  const password = passwordElement.value;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((e) => {
      user = firebase.auth().currentUser;
      uid = user.uid;
      taskListPage = new TaskListPage();
      document
        .getElementById("login-page")
        .setAttribute("class", "card d-none");
      document
        .getElementById("task-list-page")
        .setAttribute("class", "card d-block");
    })
    .catch((err) => {
      if (err.code = "auth/wrong-password") {
        document.getElementById("login-alert").innerHTML = err.message;
      }
    });
});

// Register
document.getElementById("complete-reg-btn").addEventListener("click", (e) => {
  const emailElement = document.getElementById("reg-email");
  const passwordElement = document.getElementById("reg-password");
  const email = emailElement.value;
  const password = passwordElement.value;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((e) => {
      user = firebase.auth().currentUser;
      uid = user.uid;
      taskListPage = new TaskListPage();
      document
        .getElementById("registration-page")
        .setAttribute("class", "card d-none");
      document
        .getElementById("task-list-page")
        .setAttribute("class", "card d-block");
        //debugger;
    })
    .catch((err) => {
      // Email already in use
      if (err.code = "auth/email-already-in-use") {
        document.getElementById("reg-alert").innerHTML = err.message;
      }
    });
});

document.getElementById("nav-bar-register").addEventListener("click", (e) => {
  document.getElementById("login-page").setAttribute("class", "card mt-4 d-none");
  document.getElementById("task-list-page").setAttribute("class", "card mt-4 d-none");
  document.getElementById("registration-page").setAttribute("class", "card mt-4 d-block");
});

document.getElementById("nav-bar-login").addEventListener("click", function(e) {
  document.getElementById("login-page").setAttribute("class", "card mt-4 d-block");
  document.getElementById("task-list-page").setAttribute("class", "card mt-4 d-none");
  document.getElementById("registration-page").setAttribute("class", "card mt-4 d-none");
});

document.getElementById("nav-bar-list").addEventListener("click", function(e) {
  document.getElementById("task-list-page").setAttribute("class", "card mt-4 d-block");
  document.getElementById("login-page").setAttribute("class", "card mt-4 d-none");
  document.getElementById("registration-page").setAttribute("class", "card mt-4 d-none");
});

<script>
  import { fade } from "svelte/transition";

  const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  let currentFilter = "all";
  let newTask = "";
  let tempId = 4;
  let tasks = [
    {
      id: 1,
      description: "Schedule appointment",
      completed: false,
      editing: false
    },
    {
      id: 2,
      description: "Send email",
      completed: false,
      editing: false
    },
    {
      id: 3,
      description: "Register for conference",
      completed: false,
      editing: false
    }
  ];

  function addTask(event) {
    if (event.which === ENTER_KEY) {
      tasks.push({
        id: tempId,
        description: newTask,
        completed: false,
        editing: false
      });
      tasks = tasks;
      tempId += 1;
      newTask = "";
    }
  }

  function editTask(task) {
    task.editing = true;
    tasks = tasks;
  }

  function finishEdit(task) {
    task.editing = false;
    tasks = tasks;
  }

  function finishEditKeydown(task, event) {
    if (event.which === ENTER_KEY) {
      finishEdit(task);
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
  }

  function selectAllTasks(event) {
    tasks.forEach(task => (task.completed = event.target.checked));
    tasks = tasks;
  }

  function updateFilter(filter) {
    currentFilter = filter;
  }

  function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
  }

  $: tasksRemaining = tasks.filter(task => !task.completed).length;

  $: filteredTasks =
    currentFilter === "all"
      ? tasks
      : currentFilter === "completed"
      ? tasks.filter(task => task.completed)
      : tasks.filter(task => !task.completed);
</script>

<style>
  .completed {
    text-decoration: line-through;
  }

  .filter-button {
    background: white;
  }

  .filter-button.active {
    background: red;
  }
</style>

<div class="container">
  <input
    class="task-input"
    placeholder="Enter a task"
    bind:value={newTask}
    on:keydown={addTask} />

  {#each filteredTasks as task}
    <div class="task" transition:fade>
      <div class="completed-task">
        <input type="checkbox" bind:checked={task.completed} />
      </div>
      {#if task.editing}
        <input
          class="edit-task"
          on:blur={() => finishEdit(task)}
          on:keydown={() => finishEditKeydown(task, event)}
          bind:value={task.description}
          autofocus />
      {:else}
        <div
          class={task.completed ? 'task completed' : 'task'}
          on:dblclick={() => editTask(task)}>
           {task.description}
        </div>
      {/if}
      <div class="delete-task" on:click={() => deleteTask(task.id)}>x</div>
    </div>
  {/each}

  <div class="all-tasks">
    <input type="checkbox" on:change={selectAllTasks} />
    Select all tasks
    <p>{tasksRemaining} items left</p>
  </div>

  <div class="filter-tasks">
    <button
      class={currentFilter === 'all' ? 'filter-button active' : 'filter-button'}
      on:click={() => updateFilter('all')}>
      All
    </button>
    <button
      class={currentFilter === 'active' ? 'filter-button active' : 'filter-button'}
      on:click={() => updateFilter('active')}>
      Active
    </button>
    <button
      class={currentFilter === 'completed' ? 'filter-button active' : 'filter-button'}
      on:click={() => updateFilter('completed')}>
      Completed
    </button>
  </div>

  <button on:click={clearCompletedTasks}>Clear completed tasks</button>
</div>

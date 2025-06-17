export class HistoryManager {
    constructor() {
      this.undoStack = [];
      this.redoStack = [];
    }
  
    execute(doAction, undoAction) {
      this.undoStack.push({ doAction, undoAction });
      doAction();
      this.redoStack = []; // clear future on new action
    }
  
    undo() {
      const action = this.undoStack.pop();
      if (action) {
        action.undoAction();
        this.redoStack.push(action);
      }
    }
  
    redo() {
      const action = this.redoStack.pop();
      if (action) {
        action.doAction();
        this.undoStack.push(action);
      }
    }
  }
  
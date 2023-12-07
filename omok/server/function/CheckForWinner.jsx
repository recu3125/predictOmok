import React, { useState, useEffect } from "react";


export function checkForWinner(board, size) {
    const stones = board.stones;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const key = `${row},${col}`;
        const color = stones[key];
        if (color) {
          let winningStones;
          if (winningStones = isConsecutive(stones, row, col, 0, 1, color, size) ||
            isConsecutive(stones, row, col, 1, 0, color, size) ||
            isConsecutive(stones, row, col, 1, 1, color, size) ||
            isConsecutive(stones, row, col, 1, -1, color, size)) {
            return winningStones;
          }
        }
      }
    }
    return false;
  }
  
  function isConsecutive(stones, row, col, rowDelta, colDelta, color, size) {
    let winningStones = [[row, col]];
    for (let i = 1; i < 5; i++) {
      const nextRow = row + i * rowDelta;
      const nextCol = col + i * colDelta;
      if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
        return false;
      }
      const key = `${nextRow},${nextCol}`;
      if (stones[key] !== color) {
        return false;
      }
      winningStones.push([nextRow, nextCol]);
    }
    return winningStones;
  }
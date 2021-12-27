import React from 'react';
import { Played } from '../types';

export const scissors = <>&#9996;</>;
export const rock = <>&#9994;</>;
export const paper = <>&#9995;</>;
export const trophy = <>&#127942;</>
export const question = <>&#8265;</>

export const getPlayedEmoji = (played: Played) => {
  if (played === Played.Paper) return paper;
  if (played === Played.Scissors) return scissors;
  if (played === Played.Rock) return rock;
  return question
}
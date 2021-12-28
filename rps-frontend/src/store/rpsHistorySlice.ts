import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { RootState } from ".";
import { GameResult } from '../types';
import { validateHistoryResponse } from '../utils';
import { updateError } from './notificationSlice';

export interface RpsHistoryState {
  playerSearched: string,
  numberOfPages: number,
  history: GameResult[],
  status: 'idle' | 'loading' | 'failed'
}

const initialState: RpsHistoryState = {
  playerSearched: '',
  numberOfPages: 0,
  history: [],
  status: 'idle',
}

export const updateHistoryAsync = createAsyncThunk(
  'rpsHistory/fetchHistory',
  async ({ playerName, pageNum }: { playerName: string, pageNum: number}, thunkApi) => {
    try {
      const historyResponse = await axios.get(`/api/history/?player=${playerName}&page=${pageNum}`);
      const pageNumberCountResponse = await axios.get(`/api/history/pagecount?player=${playerName}`);

      const count = Number(pageNumberCountResponse.data);
      const validated = validateHistoryResponse(historyResponse.data);
      const validatedCount = isNaN(count) ? undefined : count;

      if ((!validatedCount || !validated) && playerName !== '') {
        console.log(validatedCount, validated);
        thunkApi.dispatch(updateError(`no data available for player: ${playerName}`));
      }
      return { history: validated, numOfPages: validatedCount };
    } catch (e) {
      thunkApi.dispatch(updateError(`Fetching data for player: ${playerName} failed. Please come back later`));
      return Promise.reject(new Error('fetching data failed'));
    }
  }
);

const rpsHistorySlice = createSlice({
  name: 'rpsHistory',
  initialState,
  reducers: {
    updatePlayerSearched: (state, action: PayloadAction<string>) => {
      state.playerSearched = action.payload;
    },
    updateNumberOfPages: (state, action: PayloadAction<number>) => {
      state.numberOfPages = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHistoryAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateHistoryAsync.fulfilled, (state, action) => {
        state.status = 'idle';
        const his = action.payload.history;
        if (his) {
          state.history = his;
        }
        else {
          state.history = [];
        }
        const pageCount = action.payload.numOfPages;
        if (pageCount) {
          state.numberOfPages = pageCount;
        }
        else {
          state.numberOfPages = 0;
        }
      })
      .addCase(updateHistoryAsync.rejected, (state) => {
        state.status = 'failed';
      })
  }
});

export const { updatePlayerSearched } = rpsHistorySlice.actions;

export const selectPlayerSearched = (state: RootState) => state.rpsHistory.playerSearched;
export const selectHistory = (state: RootState) => state.rpsHistory.history;
export const selectNumberOfPages = (state: RootState) => state.rpsHistory.numberOfPages;
export const selectHistoryStatus = (state: RootState) => state.rpsHistory.status;

export default rpsHistorySlice.reducer;

import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import rpsHistoryReducer from './rpsHistorySlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    rpsHistory: rpsHistoryReducer,
    notification: notificationReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

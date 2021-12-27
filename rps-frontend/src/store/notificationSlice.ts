import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";

export interface NotificationState {
  error: string,
}

const initialState: NotificationState = {
  error: '',
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    updateError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    hideError: (state) => {
      state.error = ''
    },
  }
})

export const { updateError, hideError } = notificationSlice.actions;

export const selectError = (state: RootState) => state.notification.error;

export default notificationSlice.reducer;

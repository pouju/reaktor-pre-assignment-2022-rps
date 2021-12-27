import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { hideError, selectError } from '../store/notificationSlice';

const ShowError = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);

  const showError = () => {
    setTimeout(() => {
      dispatch(hideError());
    }, 8000);

    return (
      <div style={{ color: 'red'}}>
        {error}
      </div>
    )
  }

  return (
    <div>
      { error && showError() }
    </div>
  )
}

export default ShowError;

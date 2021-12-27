import React, { createRef, useEffect, useState } from 'react';
import { Pagination } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
  useAppDispatch,
  useAppSelector } from '../hooks/hooks';
import {
  selectHistory,
  selectHistoryStatus,
  selectNumberOfPages,
  selectPlayerSearched,
  updateHistoryAsync
} from '../store/rpsHistorySlice';
import GameResultTable from './GameResultTable';
import PlayerSummary from './PlayerSummary';

const useStyles = makeStyles(() => ({
  root: {
    margin: 10
  },
  pagination: {
    margin: 20,
    display: 'flex',
    justifyContent: 'center'
  }
}));

const PlayerHistory = () => {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const scrollRef = createRef<HTMLDivElement>();
  const playerName = useAppSelector(selectPlayerSearched);
  const history = useAppSelector(selectHistory);
  const numberOfPages = useAppSelector(selectNumberOfPages);
  const status = useAppSelector(selectHistoryStatus);
  const [pageNumber, setPageNumber] = useState(0);

  useEffect(() => {
    setPageNumber(0);
    dispatch(updateHistoryAsync({ playerName, pageNum: 0 }));
  }, [playerName]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    scrollRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
    setPageNumber(page - 1);
    dispatch(updateHistoryAsync({ playerName, pageNum: page - 1 }));
    
  }

  const createPagination = () => (
    <Pagination
      className={classes.pagination}
      count={numberOfPages}
      showFirstButton
      showLastButton
      onChange={handlePageChange}
      page={pageNumber + 1}
    />
  )

  return (
    <div className={classes.root}>
      <PlayerSummary />
      <div ref={scrollRef}>
        { status === 'loading' && status }
        <GameResultTable gameResults={history}/>
      </div>
      { history.length > 0 && createPagination() }
    </div>
  )
}

export default PlayerHistory;

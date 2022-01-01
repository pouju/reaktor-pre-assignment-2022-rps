import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import axios from 'axios';
import { useAppSelector } from '../hooks/hooks';
import { selectPlayerSearched } from '../store/rpsHistorySlice';
import { PlayerSummaryData } from '../types';
import { validateSummaryResponse } from '../utils';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const useStyles = makeStyles(({
  summary: {
    marginBottom: 10,
    display: 'inline-flex',
    padding: 10
  }
}))

/**
 * Fetches currently selected player's summary data and creates a simple table to show this data
 * Used by PlayerHistory component
 */
const PlayerSummary = () => {
  const classes = useStyles();
  const selectedPlayer = useAppSelector(selectPlayerSearched);
  const [summary, setSummary] = useState<PlayerSummaryData | undefined>(undefined);

  useEffect(() => {
    const fetchSummary = async (player: string) => {
      const response = await axios.get(`/api/history/summary/${player}`);
      const validated = validateSummaryResponse(response.data);
      setSummary(validated);
    }

    if (selectedPlayer) {
      fetchSummary(selectedPlayer);
    }
  }, [selectedPlayer]);

  return (
    <div className={ classes.summary }>
      {
        selectedPlayer
          ? <h3>{ selectedPlayer }</h3>
          : <>Select Player to see history data</>
      }
      {
        summary
          && 
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Win Ratio</TableCell>
                  <TableCell>Games Played</TableCell>
                  <TableCell>Most Played Hand</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell> { summary.winRatio }</TableCell>
                  <TableCell> { summary.totalGames }</TableCell>
                  <TableCell>{ summary.mostPlayedHand }</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
      }
    </div>
  )
}

export default PlayerSummary;

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { GameResult } from '../types';
import { getWinner } from '../utils';
import { getPlayedEmoji, trophy, question } from '../utils/emojis';

const useStyles = makeStyles(() => ({
  root: {
  },
  gameCell: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  gameCellNameL: {
    width: '40%'
  },
  gameCellNameR: {
    width: '40%',
    textAlign: 'right'
  },
  gameCellVs: {
    width: '20%',
    textAlign: 'center'
  }
}));

const formGameCell = (gameResult: GameResult) => {
  const classes = useStyles();
  
  return (
    <div className={classes.gameCell}>
      <div className={classes.gameCellNameL}>
        {gameResult.playerA.name}
      </div>
      <div className={classes.gameCellVs}>
        {getPlayedEmoji(gameResult.playerA.played)}
        vs.
        {getPlayedEmoji(gameResult.playerB.played)}
      </div>
      <div className={classes.gameCellNameR}>
        {gameResult.playerB.name}
      </div>
    </div>
  )
  
}

const formWinnerCell = (gameResult: GameResult) => {
  const winner = getWinner(gameResult.playerA, gameResult.playerB);
  return (
    <>
      { 
        winner 
          ? <>{ trophy } { winner.name }</>
          : <>{question} Draw Game </>
      }
    </>
  )
}

const formTimeCell = (gameResult: GameResult) => {
  const date = new Date(gameResult.t);
  return date.toLocaleString();
}

const GameResultTable = ({ gameResults }: { gameResults: GameResult[] }) => {

  if (gameResults.length === 0) {
    return <></>
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: '20%' }}>Game ID</TableCell>
            <TableCell style={{ width: '20%' }}>Played at</TableCell>
            <TableCell style={{ width: '40%', textAlign: 'center' }}>Game</TableCell>
            <TableCell style={{ width: '20%' }}>Winner</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            gameResults.map((row) => (
              <TableRow key={row.gameId}>
                <TableCell>{row.gameId}</TableCell>
                <TableCell>{formTimeCell(row)}</TableCell>
                <TableCell>{formGameCell(row)}</TableCell>
                <TableCell>{formWinnerCell(row)}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default GameResultTable;

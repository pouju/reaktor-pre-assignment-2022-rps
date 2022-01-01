import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { GameResult } from '../types';
import { getWinner } from '../utils';
import { getPlayedEmoji, trophy } from '../utils/emojis';

/**
 * Forms one card component wrapping one game result.
 * Used by RpsLive component.
 * @param  `GameResult` object
 */
const WsGameResult = ({ playerA, playerB, t }: GameResult) => {
  const winner = getWinner(playerA, playerB);
  const date = new Date(t);
  const day = date.toLocaleString();

  return (
    <Card variant='outlined'>
      <CardContent>
        <Typography>
          Game Played: { day }
        </Typography>
      </CardContent>
      <CardContent>
        <Typography>
          {playerA.name}
          {getPlayedEmoji(playerA.played)}
          vs.
          {getPlayedEmoji(playerB.played)}
          {playerB.name}
        </Typography>
      </CardContent>
      <CardContent>
        <Typography>
          { 
            winner 
              ? <>{ winner.name } { trophy }</>
              : <>Draw Game</>
          }
        </Typography>
      </CardContent>
    </Card>
  )
}

export default WsGameResult;

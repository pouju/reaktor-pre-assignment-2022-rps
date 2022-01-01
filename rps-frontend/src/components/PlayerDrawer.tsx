import React, { useEffect, useState } from 'react';
import { Drawer, Box, List, ListItemText, IconButton, ListItemButton } from '@mui/material';
import axios from 'axios';
import { isStringArray } from '../types';
import { useAppSelector, useAppDispatch } from '../hooks/hooks';
import { selectPlayerSearched, updatePlayerSearched } from '../store/rpsHistorySlice';
import { updateError } from '../store/notificationSlice';

type Anchor = 'left' | 'right'

/**
 * Fetches all playernames from backend and creates a simple drawer i.e. side panel where user can select player
 * whose history data they would like to see
 * @param param0 Anchor specifies if drawer / sidepanel is on left or rigth: possible values: `left` | `right`
 */
const PlayerDrawer = ({ anchor }: { anchor: Anchor }) => {
  const dispatch = useAppDispatch();
  const selectedPlayer = useAppSelector(selectPlayerSearched)
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const response = await axios.get('/api/history/players');
      const data: unknown = response.data;
      if (isStringArray(data)) {
        setPlayers(data.sort());
      } else {
        dispatch(updateError('Could not load players'));
      }
    }
    fetchPlayers();
  }, [])

  const toggleDrawer = () => {
    setOpen(!open);
  }

  const handleListItemClick = (player: string) => {
    dispatch(updatePlayerSearched(player))
  }

  const playerList = () => (
    <Box
      sx={{ width: 250 }}
      role='presentation'
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >
      <List>
        {
          players.map((player) => (
            <ListItemButton
              key={player}
              selected={selectedPlayer === player}
              onClick={() => handleListItemClick(player)}
            >
              <ListItemText primary={player} />
            </ListItemButton>
          ))
        }
      </List>

    </Box>
  )

  return (
    <div>
      <IconButton
        size="medium"
        color="inherit"
        aria-label="select player"
        onClick={toggleDrawer}
      >
        Select player
      </IconButton>
      <Drawer
        anchor={anchor}
        open={open}
        onClose={toggleDrawer}
      >
        { playerList() }
      </Drawer>
    </div>
  )


}

export default PlayerDrawer;

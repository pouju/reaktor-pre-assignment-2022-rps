import React from 'react';
import { AppBar, Toolbar, Typography, } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PlayerDrawer from './PlayerDrawer';

const useStyles = makeStyles(() => ({
  title: {
    
  },
  buttons: {
    marginLeft: 'auto'
  }
}));

/**
 * Simple header component wrapping menus etc.
 */
const Header = () => {
  const classes = useStyles();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h5" component="div" className={classes.title}>
            Rock - Paper - Scissors
        </Typography>
        <div className={classes.buttons}>
          <PlayerDrawer anchor={'right'} />
        </div>
      </Toolbar>
    </AppBar>
  )
}

export default Header;

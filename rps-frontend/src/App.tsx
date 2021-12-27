import React from 'react';
import PlayerHistory from './components/PlayerHistory';
import RpsLive from './components/RpsLive';
import Header from './components/Header';
import ShowError from './components/ShowError';

const App = () => {
  return (
    <div className='App'>
      <Header />
      <RpsLive />
      <ShowError />
      <PlayerHistory />
    </div>
  );
}

export default App;

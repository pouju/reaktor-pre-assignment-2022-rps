import React, { useState } from 'react';
import { w3cwebsocket } from 'websocket';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Controller } from 'swiper';
import { webSocketAddress } from '../utils/constants';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/autoplay';

import { makeStyles } from '@mui/styles';
import { GameBegin, GameResult } from '../types';
import { validateWsResponse } from '../utils';
import WsGameResult from './WsGameResult';

const useStyles = makeStyles(() => ({
  slider: {
    marginTop: 20
  }
}));

const client = new w3cwebsocket(webSocketAddress);

client.onopen = () => {
  console.log('websocket open');
}

const RpsLive = () => {
  const classes = useStyles();
  const noSlides = 10;
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [gameBegins, setGameBegins] = useState<GameBegin[]>([]);
  
  client.onmessage = (message) => {
    const dataReceived = JSON.parse(JSON.parse(message.data.toString()));
    const validated = validateWsResponse(dataReceived);

    if (validated) {
      if (validated.type === 'GAME_BEGIN') {
        // Store new ongoing games
        if (gameBegins.filter((b) => b.gameId === validated.gameId).length === 0) {
          setGameBegins(gameBegins.concat(validated));
        }
      }
      else {
        // Store new game results. Last `noSlides` results are showed
        if (gameResults.filter((r) => r.gameId === validated.gameId).length === 0) {
          setGameBegins([ ...gameBegins].filter((b) => b.gameId !== validated.gameId));
          const oldGameResults = [ ...gameResults]
          if (gameResults.length > noSlides - 1 ) {
            oldGameResults.shift()
            setGameResults(oldGameResults.concat(validated));
          }
          else {
            setGameResults(oldGameResults.concat(validated));
          }
        }
        
      }
    }
  }

  const createResultSlides = () => (
    new Array(gameResults.length).fill(null).map((_, i) => (
      <SwiperSlide key={`Result-slide-${i}`}>
        { gameResults[i] && <WsGameResult { ...gameResults[i] } /> }
      </SwiperSlide>
    ))
  );

  const createBeginSlides = () => (
    new Array(gameBegins.length).fill(null).map((_, i) => {
      return <SwiperSlide key={`Begin-slide-${i}`}>
        <div>
          { gameBegins[i] && gameBegins[i].playerA.name } vs. { gameBegins[i] && gameBegins[i].playerB.name } 
        </div>
      </SwiperSlide>
    })
  );

  const swiperOptions = {
    modules: [Autoplay, Controller],
    slidesPerView: window.innerWidth / 400,
    grabCursor: true,
    spaceBetween: 5,
    loop: false,
    centeredSlides: true,
    speed: 2000,
    autoplay: {
      delay: 1,
      disableOnInteraction: false
    }
  }

  const createBeginSlider = () => (
    <Swiper { ...swiperOptions }>
      { createBeginSlides() }
    </Swiper>
  )

  const createResultSlider = () => (
    <Swiper { ...swiperOptions }>
      { createResultSlides() }
    </Swiper>
  )  

  return (
    <div>
      <div className={ classes.slider }>
        { createBeginSlider() }
      </div>
      <div className={ classes.slider }>
        { createResultSlider() }
      </div>
    </div>
  )
}

export default RpsLive;

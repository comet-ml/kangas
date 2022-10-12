import React, { useEffect, useRef, useState } from 'react';
// import PropTypes from 'prop-types';
import WaveSurfer from 'wavesurfer.js';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';

// import noop from 'lodash/noop';

import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
// Client components
import PlayerButtons from './PlayerButtons.client';

const Player = ({ autoPlay, src, onLoad, onError, height }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const playerEl = useRef(null);
    const wavesurferRef = useRef(null);

    const hideCursor = () => {
        wavesurferRef.current.params.cursorWidth = 0;
        wavesurferRef.current.setCursorColor('#000');
    };

    const showCursor = () => {
        wavesurferRef.current.params.cursorWidth = 1;
        wavesurferRef.current.setCursorColor('#000');
    };

    useEffect(() => {
        const wavesurfer = WaveSurfer.create({
            container: playerEl.current,
            cursorWidth: 0,
            height,
            progressColor: '#86C5D8',
            waveColor: '#CAE9F5',
            plugins: [
                CursorPlugin.create({
                    customShowTimeStyle: {
                        'background-color': '#000',
                        color: '#fff',
                        padding: '2px',
                        'font-size': '12px',
                    },
                    showTime: true,
                    opacity: 1,
                }),
            ],
            xhr: {
                credentials: 'include',
            },
        });

        wavesurfer.cursor.hideCursor();

        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('ready', handleReady);
        wavesurfer.on('finish', hideCursor);
        wavesurfer.on('error', (error) => {
            // Wavesurfer fires an error for AbortEvent's, which causes things to explode if we don't catch it
            if (error instanceof DOMException) {
                console.error(`Wavesurfer aborted: ${error.message}`);
                return;
            }
            onError(error);
            // FIXME: do something here with error?
        });

        wavesurferRef.current = wavesurfer;

        return () => wavesurfer.destroy();
    }, []);

    useEffect(() => {
        setIsReady(false);
        try {
            wavesurferRef.current.load(src);
        } catch {
            console.error('failed to load audio file');
        }
    }, [src]);

    const handlePause = () => {
        hideCursor();
        wavesurferRef.current.pause();
    };

    const handlePlay = () => {
        showCursor();
        wavesurferRef.current.play();
    };

    const handleReady = () => {
        hideCursor();
        onLoad();
        setIsReady(true);

        if (autoPlay) {
            wavesurferRef.current.play();
        }
    };

    const handleStop = () => {
        hideCursor();
        wavesurferRef.current.stop();
    };

    let buttonsOrLoading;

    if (isReady) {
        buttonsOrLoading = (
            <div className="audio-player-buttons">
                <PlayerButtons
                    isPlaying={isPlaying}
                    onPause={handlePause}
                    onPlay={handlePlay}
                    onStop={handleStop}
                />
            </div>
        );
    } else {
        buttonsOrLoading = (
            <Grid
                className="audio-player-loading"
                alignItems="center"
                justify="center"
                container
            >
                <CircularProgress />
            </Grid>
        );
    }

    const visibility = isReady ? 'visible' : 'hidden';

    return (
        <div className="audio-player">
            {buttonsOrLoading}

            <div ref={playerEl} id="waveform" style={{ visibility }} />
        </div>
    );
};
/*
Player.defaultProps = {
  autoPlay: false,
  onError: noop,
  onLoad: noop,
  height: 90
};

Player.propTypes = {
  autoPlay: PropTypes.bool,
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  src: PropTypes.string.isRequired,
  height: PropTypes.number
};*/

export default Player;

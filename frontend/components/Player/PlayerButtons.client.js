import React from 'react';
// import PropTypes from 'prop-types';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
// import noop from 'lodash/noop';

import PauseIcon from '@material-ui/icons/Pause';
import PlayIcon from '@material-ui/icons/PlayArrow';

// This should be a server component minus the onClick
const PlayerButtons = ({ isPlaying, onPause, onPlay }) => {
    const PlayPauseIcon = isPlaying ? PauseIcon : PlayIcon;
    const playPauseHandler = isPlaying ? onPause : onPlay;

    return (
        <Grid alignItems="center" justify="center" spacing={1} container>
            <Grid item>
                <Fab
                    classes={{
                        sizeSmall: 'audio-player-button',
                    }}
                    size="small"
                    onClick={playPauseHandler}
                >
                    <PlayPauseIcon className="audio-player-button-icon" />
                </Fab>
            </Grid>
        </Grid>
    );
};

/*
PlayerButtons.defaultProps = {
  isPlaying: false,
  onPause: noop,
  onPlay: noop
};

PlayerButtons.propTypes = {
  isPlaying: PropTypes.bool,
  onPause: PropTypes.func,
  onPlay: PropTypes.func
}; */

export default PlayerButtons;

/* eslint-disable max-len */
import React from 'react';

export default React.createClass({
  render() {
    return (
      <div className='video-loading'>
        <svg
          height='32'
          viewBox='0 0 32 32'
          width='32'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M16 0 A16 16 0 0 0 16 32 A16 16 0 0 0 16 0 M16 4 A12 12 0 0 1 16 28 A12 12 0 0 1 16 4'
            opacity='.25' />
          <path d='M16 0 A16 16 0 0 1 32 16 L28 16 A12 12 0 0 0 16 4z' />
        </svg>
      </div>
    );
  }
});
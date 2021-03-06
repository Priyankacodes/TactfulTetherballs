import React from 'react';
import {connect} from 'react-redux';
import {Switch, Route, withRouter} from 'react-router-dom';
import io from 'socket.io-client';

import MessageBoardContainer from '../containers/MessageBoardContainer';
import {updateMessages, setMessages} from '../actions/messages';
import {logIn, updateLocation} from '../actions/user';


const App = ({user, messages, logIn, updateMessages, updateLocation, setMessages}) => {
  const socket = io();
  let username;

  const getLocationAndUpdate = (username) =>
    new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject))
      .then(pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        return fetch(`/api/users/${username}/${lat}/${lon}`, {
          method: 'PUT'
        });
      })
      .then(res => res.json())
      .then(region => {
        console.log('In region', region.region)
        updateLocation(region);
        socket.emit('subscribe', region.region);
        return fetch(`/api/messages/${region.region}`, {
          method: 'GET'
        });
      })
      .then((response) => {
        console.log('in the room')
        return response.json()
      })
      .then((messages) => {
        setMessages(messages)
      })

  const checkUsername = () => {
    console.log('checkUsername called')
    fetch(`/api/users/${username}`, {method: 'POST'})
      .then(res => {
        if (res.status === 201) {
          logIn(username);
          //socket.on('message', message => {
           // updateMessages(message);
            //getLocationAndUpdate(username);

          //});
        } else{
            logIn(username);
            //socket.on('message', message => {
            //  updateMessages(message);
            //});

          // socket.on('initialMessages', messages => {
          //   console.log('In app socket.on.initial.messages', messages)
          //   setMessages(messages);
          // });
          getLocationAndUpdate(username);
        }
      });

  };

  if (user.username === null) {

    logIn('Login');
    $.get( "/usertest", function( data ) {
      if (data) {
        username = data;
        logIn(username);
        getLocationAndUpdate(username);
        checkUsername();
      }
    });
        //checkUsername();
  }

  socket.on('message', message => {
    updateMessages(message);
  })

  // <Navbar />
  return (
    <div className="app">
      <Switch>
        <Route exact path='/' render={props => <MessageBoardContainer socket={socket} />} />
      </Switch>
    </div>
  );
};

const mapStateToProps = ({user, messages}) => ({
  user,
  messages
});

const mapDispatchToProps = dispatch => ({
  logIn: username => {
    dispatch(logIn(username));
  },
  updateMessages: message => {
    dispatch(updateMessages(message));
  },
  updateInitialMessages: messages => {
    dispatch(updateInitialMessages(messages));
  },
  setMessages: messages => {
    dispatch(setMessages(messages));
  },
  updateLocation: location => {
    dispatch(updateLocation(location));
  }
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
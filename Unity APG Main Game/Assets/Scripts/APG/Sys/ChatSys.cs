﻿using System;
using System.Collections.Generic;

namespace APG {
	public class ChatSys : ChatterInterface {
		List<Chatter> chatters = new List<Chatter>();
		Dictionary<string, int> chatterID = new Dictionary<string, int>();
		AudiencePlayersSys apgSys;
		Action<string, string> customMsgEventFunction = (name, message) => { };

		public ChatSys( AudiencePlayersSys src ) {
			apgSys = src;
		}

		public int Count() {
			return chatters.Count;
		}

		public string GetName( int id ) {
			if( id < 0 || id >= chatters.Count || chatters[id] == null )return "";
			return chatters[id].name;
		}

		public string GetMessage( int id ) {
			if( id < 0 || id >= chatters.Count || chatters[id] == null )return "";
			return chatters[id].msg.ToString();
		}

		public void Clear() {
			chatters = new List<Chatter>();
			chatterID = new Dictionary<string, int>();
		}

		public void ClearOlderThan( int maxLifeTime ) {
			var newChatters = new List<Chatter>();
			var newChatterID = new Dictionary<string, int>();

			for( var k = 0; k < chatters.Count; k++ ) {
				var chatter = chatters[k];
				if( apgSys.time - chatter.time < maxLifeTime ){
					newChatterID[chatter.name] = newChatters.Count;
					newChatters.Add(chatter);
				}
			}
			chatters = newChatters;
			chatterID = newChatterID;
		}


		public void SetMessageEventFunction( Action<string,string> messageFunction ) {
			if( messageFunction == null )return;
			customMsgEventFunction = messageFunction;
		}


		public void Log( string name, string msg, int time ) {
			customMsgEventFunction( name, msg );
			if(chatterID.ContainsKey(name) == false) {
				chatterID[name] = chatters.Count;
				chatters.Add( new Chatter( name, msg, time ) );
			}
			else {
				var chatter = chatters[chatterID[name]];
				chatter.msg.Length = 0;
				chatter.msg.Append( msg );
				chatter.time = time;
			}
		}

		void OnSubscribe( Action<string>) { }

		void OnDonate( Action<string, int>) { }


	}
}
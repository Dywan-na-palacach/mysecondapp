import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

function ChatRoom({ room, messages, onSend, input, setInput, onBack }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmExit = () => {
    setShowConfirm(true);
  };

  const handleExit = () => {
    setShowConfirm(false);
    onBack();
  };

  return (
    <View style={styles.container}>
      {/* Larger top margin for phone status bar */}
      <View style={styles.statusBarMargin} />

      {/* Gray header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Chatroom: {room}</Text>

        {/* Arrow touchable exactly fills right side, vertically centered */}
        <TouchableOpacity
          onPress={confirmExit}
          style={styles.arrowTouchable}
          activeOpacity={0.7}
        >
          <Text style={styles.arrowIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Messages list */}
      <FlatList
        data={messages[room] || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.encryptionTag}>
              [{item.encryption}] • {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />

      {/* Input area pinned to bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={onSend}>
            <Text style={styles.itemText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.sectionHeader}>Exit Chat?</Text>
            <Text style={styles.confirmText}>
              You are about to quit the conversation. Do you want to continue?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity onPress={handleExit} style={[styles.confirmButton, { backgroundColor: 'crimson' }]}>
                <Text style={styles.itemText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={[styles.confirmButton, { backgroundColor: '#555' }]}>
                <Text style={styles.itemText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  statusBarMargin: {
    height: 60, // doubled height for status bar
    backgroundColor: '#111',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#555',
    height: 50,
    paddingHorizontal: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  headerText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrowTouchable: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%', // fills vertical height of headerBar
    width: 50, // width for comfortable tap
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', // subtle highlight for arrow background
  },
  arrowIcon: {
    color: '#eee',
    fontSize: 36,
    lineHeight: 20,
  },
  messageList: {
    padding: 10,
    paddingBottom: 100,
  },
  messageBubble: {
    backgroundColor: '#222',
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
  },
  encryptionTag: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#111',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 6,
    color: '#fff',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007acc',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  itemText: {
    color: '#fff',
    fontSize: 15,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  sectionHeader: {
    color: '#00bcd4',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmText: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
});

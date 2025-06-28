
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Keyboard,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { DevSettings } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { RNCamera } from 'react-native-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatRoom from './ChatRoom'; // This will be defined separately
import LocationModal from './LocationModal';
import auth from '@react-native-firebase/auth';
import LoginScreen from './LoginScreen'; // ścieżka do pliku
import firestore from '@react-native-firebase/firestore';



export default function App() {
  const generateKey = () => Math.random().toString(36).substring(2);

  const [contacts, setContacts] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [profile, setProfile] = useState({ name: 'You', pubKey: generateKey(), email: '' });
  const [messages, setMessages] = useState({ Doppelganger: [] });
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('encrypt1');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showLocation, setShowLocation] = useState(false);
  const [user, setUser] = useState(null);
  


  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((userAuth) => {
      setUser(userAuth);
    });
    return unsubscribe;
  }, []);
  // If user is not logged in, show login screen  


  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const saveContacts = async (newContacts) => {
    setContacts(newContacts);
    await AsyncStorage.setItem('contacts', JSON.stringify(newContacts));
  };

  const loadContacts = async () => {
    const data = await AsyncStorage.getItem('contacts');
    if (data) {
      const parsed = JSON.parse(data);
      setContacts(parsed);
      const chatData = parsed.reduce((acc, c) => {
        acc[c.name] = [];
        return acc;
      }, {});
      setMessages((prev) => ({ ...prev, ...chatData }));
    }
  };

  // Request camera permission for Android 6+
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs access to your camera to scan QR codes.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS or other platforms assumed granted
  };

  // Handle Scan Invite action with permission request
  const handleScanInvite = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      setModalMode('scan');
      setModalVisible(true);
    } else {
      Alert.alert('Permission denied', 'Camera permission is required to scan QR codes.');
    }
  };

  // Handle sending messages
  const handleSend = () => {
    if (!input.trim() || !activeRoom) return;

    const newMsg = {
      id: Date.now().toString(),
      content: input.trim(),
      encryption: activeTab,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), newMsg],
    }));

    setInput('');
    Keyboard.dismiss();
  };

  // Reload app shortcut
  const reloadApp = () => DevSettings.reload();

  
  // Exit chatroom, deleting conversation
  const handleExitRoom = () => {
    setMessages((prev) => {
      const updated = { ...prev };
      delete updated[activeRoom];
      return updated;
    });
    setActiveRoom(null);
  };
 


  // Handle scanning QR code result
  const handleQRCodeScanned = (data) => {
    if (scanned) return;

    try {
      const parsed = JSON.parse(data);
      const exists = contacts.some((c) => c.name === parsed.name && c.pubKey === parsed.pubKey);

      if (parsed?.name && parsed?.pubKey && !exists) {
        const newContacts = [...contacts, parsed];
        saveContacts(newContacts);
        setMessages((prev) => ({ ...prev, [parsed.name]: [] }));
        setScanned(true);
        setModalVisible(false);
      } else {
        Alert.alert('Contact already added or invalid QR');
      }
    } catch (e) {
      Alert.alert('Invalid QR');
    }
  };

  // Add contact from Testing section
  const handleAddContact = () => {
    const name = newContactName.trim();
    if (name && !contacts.some((c) => c.name === name) && name !== 'Doppelganger') {
      const newContacts = [...contacts, { name, pubKey: generateKey() }];
      saveContacts(newContacts);
      setMessages((prev) => ({ ...prev, [name]: [] }));
      setNewContactName('');
      setActiveTool(null); // Hide Testing section after adding contact
      Keyboard.dismiss();
    }
  };

  // Modal to add contact (share or scan QR)
  const renderAddContactModal = () => (
    <Modal visible={modalVisible} animationType="slide">
      <View style={styles.panel}>
        <Text style={styles.sectionHeader}>Add Contact</Text>
        {modalMode === 'share' ? (
          <QRCode value={JSON.stringify(profile)} size={200} />
        ) : (
          <RNCamera
            style={{ height: 300, width: '100%' }}
            onBarCodeRead={({ data }) => handleQRCodeScanned(data)}
            captureAudio={false}
          />
        )}
        <TouchableOpacity
          onPress={() => {
            setModalVisible(false);
            setScanned(false);
          }}
          style={styles.addButton}
        >
          <Text style={styles.itemText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // Modal for deleting chatrooms
  const renderDeleteRoomModal = () => (
    <Modal visible={deleteModalVisible} transparent animationType="fade">
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          {roomToDelete === null ? (
            <>
              <Text style={styles.sectionHeader}>Select Chatroom to Delete</Text>
              {contacts.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={styles.item}
                  onPress={() => setRoomToDelete(c.name)}
                >
                  <Text style={styles.itemText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: 'gray', marginTop: 10 }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.itemText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.sectionHeader, { color: 'crimson' }]}>
                Are you sure you want to delete {roomToDelete}?
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TouchableOpacity
                  onPress={() => {
                    setMessages((prev) => {
                      const updated = { ...prev };
                      delete updated[roomToDelete];
                      return updated;
                    });
                    setContacts((prev) => prev.filter((c) => c.name !== roomToDelete));
                    setRoomToDelete(null);
                    setDeleteModalVisible(false);
                  }}
                  style={[styles.confirmButton, { backgroundColor: 'crimson' }]}
                >
                  <Text style={styles.itemText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRoomToDelete(null)}
                  style={[styles.confirmButton, { backgroundColor: 'gray' }]}
                >
                  <Text style={styles.itemText}>No</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Main home screen rendering
  const renderHome = () => (
    <ScrollView style={styles.container}>
      {renderAddContactModal()}
      {renderDeleteRoomModal()}

      {/* Tabs for encryption types - because security matters */}
      <View style={styles.tabBar}>
        <Text style={styles.tabIcon}>[]</Text>
        {['encrypt1', 'q_encrypt1', 'q_encrypt2'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabItem}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeLine} />}
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={reloadApp} style={{ marginLeft: 'auto' }}>
          <Text style={styles.tabIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* List of chat rooms */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Chat Rooms</Text>
        {['Doppelganger', ...contacts.map((c) => c.name)].map((room) => (
          <TouchableOpacity
            key={room}
            style={styles.item}
            onPress={() => setActiveRoom(room)}
          >
            <Text style={styles.itemText}>{room}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tools panel with various options */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Tools</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            Alert.alert('Add Contact', 'Select a method', [
              {
                text: 'By Email',
                onPress: () => {
                  Alert.prompt?.(
                    'Enter Email',
                    'Add user by email:',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Add',
                        onPress: async (email) => {
                          try {
                            const methods = await auth().fetchSignInMethodsForEmail(email);
                            if (methods.length === 0) {
                              Alert.alert('User not found', 'This email is not registered.');
                              return;
                            }
                            const name = email.split('@')[0];
                            const exists = contacts.some((c) => c.name === name);
                            if (!exists) {
                              const newContact = { name, pubKey: generateKey() };
                              const updated = [...contacts, newContact];
                              await saveContacts(updated);
                              setMessages((prev) => ({ ...prev, [name]: [] }));
                              Alert.alert('Added!', `${name} has been added.`);
                            } else {
                              Alert.alert('Already exists', 'This user is already in your contacts.');
                            }
                          } catch (e) {
                            Alert.alert('Error', e.message);
                          }
                        },
                      },
                    ],
                    'plain-text'
                  );
                },
              },
              {
                text: 'QR feature',
                onPress: () => {
                  Alert.alert('More', 'Select an invite method', [
                    {
                      text: 'Share Invite',
                      onPress: () => {
                        setModalMode('share');
                        setModalVisible(true);
                      },
                    },
                    {
                      text: 'Scan Invite',
                      onPress: handleScanInvite,
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ]);
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]);
            
            
          }}
        >
          <Text style={styles.itemText}>Add Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            setActiveTool(activeTool === 'Profile Settings' ? null : 'Profile Settings')
          }
        >
          <Text style={styles.itemText}>Profile Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            setActiveTool(activeTool === 'Testing' ? null : 'Testing')
          }
        >
          <Text style={styles.itemText}>Testing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: 'crimson' }]}
          onPress={() => {
            setDeleteModalVisible(!deleteModalVisible);
            setRoomToDelete(null);
            setActiveTool(null);
          }}
        >
          <Text style={styles.itemText}>Delete Chatroom</Text>
        </TouchableOpacity>
      </View>

      {/*location share*/}
      
      <TouchableOpacity
        style={[styles.item, { backgroundColor: '#444' }]}
        onPress={() => setShowLocation(true)}
      >
        <Text style={styles.itemText}>📍 Lokalizacja</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.item, { backgroundColor: '#666' }]}
        onPress={() => auth().signOut()}
      >
        <Text style={styles.itemText}>🚪 Wyloguj się</Text>
      </TouchableOpacity>



      {/* Profile Settings panel */}
      {activeTool === 'Profile Settings' && (
        <View style={styles.panel}>
          <Text style={styles.sectionHeader}>Profile Settings</Text>

          {/* Change name input */}
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={profile.name}
            onChangeText={(text) =>
              setProfile((prev) => ({ ...prev, name: text }))
            }
          />

          {/* Change email input */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={profile.email}
            keyboardType="email-address"
            onChangeText={(text) =>
              setProfile((prev) => ({ ...prev, email: text }))
            }
          />

          {/* Public key string JSON */}
          <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
            Your Public Key (JSON)
          </Text>
          <View
            style={{
              backgroundColor: '#222',
              padding: 10,
              borderRadius: 6,
              marginTop: 5,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: 'monospace' }}>
              {JSON.stringify(profile, null, 2)}
            </Text>
          </View>
        </View>
      )}

      {/* Testing: create fake friend panel */}
      {activeTool === 'Testing' && (
        <View style={styles.panel}>
          <Text style={styles.sectionHeader}>Testing: Create Fake Friend</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter friend's name"
            value={newContactName}
            onChangeText={setNewContactName}
            onSubmitEditing={handleAddContact}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
            <Text style={styles.itemText}>Create Contact</Text>
          </TouchableOpacity>
        </View>
      )}
      <LocationModal visible={showLocation} onClose={() => setShowLocation(false)} />
    </ScrollView>
  );

  // Main app render logic
  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }
  
  return activeRoom ? (
    <ChatRoom
      room={activeRoom}
      messages={messages}
      onSend={handleSend}
      input={input}
      setInput={setInput}
      onBack={() => setActiveRoom(null)}
    />
  ) : (
    renderHome()
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  section: {
    marginVertical: 10,
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    padding: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00bcd4',
    marginBottom: 5,
  },
  item: {
    padding: 10,
    backgroundColor: '#333',
    marginVertical: 4,
    borderRadius: 6,
  },
  itemText: {
    color: '#fff',
    fontSize: 15,
  },
  panel: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007acc',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  tabItem: {
    marginHorizontal: 10,
    alignItems: 'center',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
  },
  activeTabText: {
    color: '#00bcd4',
    fontWeight: 'bold',
  },
  activeLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#00bcd4',
    marginTop: 4,
  },
  tabIcon: {
    color: '#fff',
    fontSize: 18,
    marginRight: 10,
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
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

export default function LocationModal({ visible, onClose }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetch('http://ip-api.com/json/')
        .then((res) => res.json())
        .then((data) => {
          setLocation(data);
          setLoading(false);
        })
        .catch(() => {
          setLocation(null);
          setLoading(false);
        });
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Twoja lokalizacja</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#00bcd4" />
          ) : location ? (
            <View>
              <Text style={styles.info}>🌍 Kraj: {location.country}</Text>
              <Text style={styles.info}>🏙️ Miasto: {location.city}</Text>
              <Text style={styles.info}>🌐 IP: {location.query}</Text>
              <Text style={styles.info}>📍 Pozycja: {location.lat}, {location.lon}</Text>
            </View>
          ) : (
            <Text style={styles.info}>Nie udało się pobrać danych.</Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Zamknij</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  box: {
    backgroundColor: '#222',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    color: '#00bcd4',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  info: {
    color: '#fff',
    marginVertical: 4,
    fontSize: 15,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007acc',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

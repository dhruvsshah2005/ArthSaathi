import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
interface Message {
  id: string;
  text: string;
  imageUri?: string | null;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your ArthSaathi AI. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleAttachImage = () => {
    Alert.alert(
      'Attach Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userText = inputText.trim();
    const userImg = selectedImage;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      imageUri: userImg,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSelectedImage(null);
    Keyboard.dismiss();

    try {
      const activeUserId = await SecureStore.getItemAsync('active_user_id');
      if (!activeUserId) {
        Alert.alert('Error', 'You must be logged in to chat.');
        return;
      }

      const formData = new FormData();
      formData.append('user_id', activeUserId);
      formData.append('session_title', 'ArthSaathi Support');
      formData.append('message', userText);

      if (userImg) {
        const fileExt = userImg.split('.').pop() || 'jpg';
        const fileName = `upload.${fileExt}`;
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('image', {
          uri: userImg,
          name: fileName,
          type: type,
        } as any);
      }

      const response = await fetch('https://graceless-freefall-nimbly.ngrok-free.dev/api/chat/message', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Server error');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.ai_response,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);

      if (data.ocr_text) {
        console.log("OCR Successfully extracted:", data.ocr_text);
      }
      
    } catch (error: any) {
      Alert.alert('Failed to send', error.message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.isUser;
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAi]}>
          {item.imageUri && (
            <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
          )}
          {item.text ? (
            <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAi]}>
              {item.text}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ArthSaathi AI Assistant</Text>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <View style={styles.inputWrapper}>
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <Pressable style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </Pressable>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <Pressable style={styles.attachBtn} onPress={handleAttachImage}>
            <Text style={styles.attachIcon}>📎</Text>
          </Pressable>
          
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <Pressable 
            style={[styles.sendBtn, (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim() && !selectedImage}
          >
            <Text style={styles.sendIcon}>⬆️</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B0A2A',
    textAlign: 'center',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 40, // Padding for safe area above input
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  messageBubbleUser: {
    backgroundColor: '#8B0A2A',
    borderBottomRightRadius: 4,
    shadowColor: '#8B0A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubbleAi: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFF',
  },
  messageTextAi: {
    color: '#111827',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 20, // Extra padding for bottom tabs / home indicator
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#374151',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  attachBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: '#111827',
  },
  sendBtn: {
    backgroundColor: '#8B0A2A',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendIcon: {
    fontSize: 16,
  },
});

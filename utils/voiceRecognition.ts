export class VoiceRecognition {
  private recognition: any;
  private isSupported: boolean;
  private isListening: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initializeRecognition();
    }
  }

  private checkSupport(): boolean {
    return !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition
    );
  }

  private initializeRecognition() {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Configuration for better accuracy
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;
    
    // Enhanced settings for better performance
    if ('webkitSpeechRecognition' in window) {
      this.recognition.webkitContinuous = false;
      this.recognition.webkitInterimResults = false;
    }
  }

  async startListening(): Promise<string> {
    if (!this.isSupported) {
      throw new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice input.');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      throw new Error('Microphone access denied. Please allow microphone access and try again.');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'));
        return;
      }

      let finalTranscript = '';
      let timeoutId: NodeJS.Timeout;

      // Set a timeout for recognition
      timeoutId = setTimeout(() => {
        this.recognition.stop();
        if (!finalTranscript) {
          reject(new Error('No speech detected. Please try speaking clearly.'));
        }
      }, 10000); // 10 second timeout

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('Voice recognition started');
      };

      this.recognition.onresult = (event: any) => {
        clearTimeout(timeoutId);
        
        // Get the best result
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Use final transcript if available, otherwise use interim
        const result = finalTranscript || interimTranscript;
        if (result.trim()) {
          this.isListening = false;
          resolve(result.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        clearTimeout(timeoutId);
        this.isListening = false;
        
        let errorMessage = 'Speech recognition error occurred';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again and speak clearly.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check your microphone settings.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      this.recognition.onend = () => {
        clearTimeout(timeoutId);
        this.isListening = false;
        
        if (!finalTranscript) {
          reject(new Error('No speech was recognized. Please try again.'));
        }
      };

      try {
        this.recognition.start();
      } catch (error) {
        clearTimeout(timeoutId);
        this.isListening = false;
        reject(new Error('Failed to start speech recognition. Please try again.'));
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isSupported(): boolean {
    return this.isSupported;
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Get available languages (if supported)
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
      'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN'
    ];
  }

  // Set language for recognition
  setLanguage(language: string) {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
}
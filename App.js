import React, { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Contacts from 'expo-contacts';
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from 'expo-linking';
import { View, Text, TextInput, TouchableOpacity, SectionList, FlatList, Switch, Modal, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PlatformPayButton, isPlatformPaySupported } from '@stripe/stripe-react-native';

import { Dimensions } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { StripeProvider } from '@stripe/stripe-react-native';



function PaymentModal({ isModalVisible, setIsModalVisible, totalAmount, contributors, physicalBook, includeAudio, gifterEmail, sendWelcomeMessages }) {
  const { createPaymentMethod, confirmPayment } = useStripe();
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  useEffect(() => {
    (async function () {
      setIsApplePaySupported(await isPlatformPaySupported());
    })();
    console.log('isApplePaySupported', isApplePaySupported);
  }, [isPlatformPaySupported]);

  const handlePay = async () => {
    if (!cardDetails?.complete) {
      alert('Please enter complete card details');
      return;
    }

    // Create a payment method from the card details
    const { error: paymentMethodError, paymentMethod } = await createPaymentMethod({
      paymentMethodType: 'Card',
      card: cardDetails,
    });
    if (paymentMethodError) {
      console.log('Failed to create payment method:', paymentMethodError.message);
      setIsErrorModalVisible(true);  // Show error modal
      return;
    }

    // Create a payment intent on the server
    const response = await fetch('https://yay-api.herokuapp.com/stripe/secret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: gifterEmail, 
        amount: totalAmount,
      }),
    });

    const data = await response.json();
    console.log('Payment intent created:', data);

    // Confirm the payment
    const { error: confirmationError } = await confirmPayment(data.client_secret, {
      paymentMethodType: 'Card',
      paymentMethodId: paymentMethod.id,
    });

    if (confirmationError) {
      console.log('Payment confirmation error:', confirmationError.message);
      setIsErrorModalVisible(true);  // Show error modal
    } else {
      // Payment was successful
      console.log('Payment successful');
      setIsModalVisible(false);
      setIsSuccessModalVisible(true);  // Show success modal
      // Send the welcome messages
      console.log('contributors', contributors)
      sendWelcomeMessages(contributors);
    }
  };

  return (
    <View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isSuccessModalVisible}
          onRequestClose={() => setIsSuccessModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              width: '50%', 
              height: '10%',  // Set the height as desired
              padding: 20, 
              backgroundColor: 'white', 
              borderRadius: 10, 
              borderWidth: 2,  
              borderColor: 'black',  
              justifyContent: 'center',  // Center content vertically
              alignItems: 'center'  // Center content horizontally
            }}>
              <Text>Payment successful.</Text>
              <TouchableOpacity style={styles.button} onPress={() => setIsSuccessModalVisible(false)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Error Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isErrorModalVisible}
          onRequestClose={() => setIsErrorModalVisible(false)}
        >
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              width: '50%', 
              height: '10%',  // Set the height as desired
              padding: 20, 
              backgroundColor: 'white', 
              borderRadius: 10, 
              borderWidth: 2,  
              borderColor: 'black',  
              justifyContent: 'center',  // Center content vertically
              alignItems: 'center'  // Center content horizontally
            }}>
              <Text>Payment failed. Please try again.</Text>
              <TouchableOpacity style={styles.button} onPress={() => setIsErrorModalVisible(false)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    
  <StripeProvider
      publishableKey="pk_test_51KtCf1LVDYVdzLHCzEQuGuw08kKelgXO7AgN6VDN874gIPxfr7dl7PvcNgUZUSnypEOxqJcMCu4G119l0MQixCkj00Rr1fOuls"
      urlScheme="com.googleusercontent.apps.764289968872-8spc0amg0j9n4lqjs0rr99s75dmmkpc7" // required for 3D Secure and bank redirects
      merchantIdentifier="merchant.givebundl" // required for Apple Pay
    >
  <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ 
            width: '80%', 
            padding: 20, 
            backgroundColor: 'white', 
            borderRadius: 10,
            borderWidth: 2,  // Add border width
            borderColor: 'black',  // Change to your desired color
          }}>
          <Text>Enter your card details:</Text>

          <CardField
            postalCodeEnabled={true}
            onCardChange={cardDetails => setCardDetails(cardDetails)}
            style={styles.cardField}
          />

          <TouchableOpacity style={styles.button} onPress={handlePay}>
            <Text style={styles.textStyle}>Pay ${totalAmount/100}.00 with Credit Card</Text>
          </TouchableOpacity>
            <View>
              {isApplePaySupported && (
                <PlatformPayButton
                  onPress={handlePay}
                  type={PlatformPay.ButtonType.Order}
                  appearance={PlatformPay.ButtonStyle.Black}
                  borderRadius={4}
                  style={{
                    width: '100%',
                    height: 50,
                  }}
                />
              )}
            </View>
          <TouchableOpacity style={styles.button} onPress={() => setIsModalVisible(false)}>
            <Text style={styles.textStyle}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </StripeProvider>
    </View>
  );
}





const { makeRedirectUri } = AuthSession;

 WebBrowser.maybeCompleteAuthSession();

export default function App() {

        const [message, setMessage] = useState("We are creating a book of supportive letters and nice pictures (or 'Bundl') for Dan G. It will only take you a minute to write and submit your letter. It should make for an unforgettable gift that shares our collective love and appreciation. Don't be the last to submit!");
        const [parsedData, setParsedData] = useState([]);
        const [userID, setUserID] = useState(null);
        const [isModalVisible, setIsModalVisible] = useState(false);
        const [notes, setNotes] = useState("");
        const [submitted, setSubmitted] = useState("");

        const [pictureSubmitted, setPictureSubmitted ] = useState(false);
        const [isTableModalVisible, setIsTableModalVisible] = useState(false);
        const [gifterEmail, setGifterEmail] = useState("");
        const [gifterFullName, setGifterFullName] = useState("");


        const [emailBody, setEmailBody] = useState('');
        const [emailSubject, setEmailSubject] = useState("Contribute please - 3 days left!");
        const [emailRecipients, setEmailRecipients] = useState([]);
        const [values, setValues] = useState([]);
  
        const [ submission, setSubmission ] = useState("");

        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [layout, setLayout] = useState('');
        const [msg, setMsg] = useState('');

        const [physicalBook, setPhysicalBook] = useState(false);
        const [includeAudio, setIncludeAudio] = useState(false);

        const [dataSource, setDataSource] = useState([]);

        const [longMessage, setLongMessage] = useState('');
        const [modalIsOpen, setModalIsOpen] = useState(false);
        const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
        const [contributors, setContributors] = useState([]);



        const [userData, setUserData] = useState(null);
        const [recipientFullName, setRecipientFullName] = useState("");
        const [recipientFirstName, setRecipientFirstName] = useState("");
        const [recipientlastName, setRecipientLastName] = useState("");
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [googleContacts, setGoogleContacts] = useState([]);
        const [ text, setText] = useState("Join us in creating a 'Bundl' of loving letters & pics for Dan G. It's a quick, fun way to share our support and appreciation. Look out for an email from dan@givebundl.com with instructions. Don't miss out!");
        const [updateLocalStorageFunction, setUpdateLocalStorageFunction] = useState(() => () => {});

        const [modalVisible, setModalVisible] = useState(false);
        const [searchTermMobile, setSearchTermMobile] = useState('');
        const [searchTerm, setSearchTerm] = useState('');
        const [contactsMobile, setContactsMobile] = useState([]);
        const [selectedContactsMobile, setSelectedContactsMobile] = useState([]);
          const [selectedContacts, setSelectedContacts] = useState([]);
        const [tableData, setTableData] = useState([]);
        const [contactCount, setContactCount] = useState([]);
        const [isContributorsModalVisible, setIsContributorsModalVisible] = useState(false);
        const [totalAmount, setTotalAmount] = useState(0);


        const [userInfo, setUserInfo] = useState(null);
        const [token, setToken] = useState("");
        const [request, response, promptAsync] = Google.useAuthRequest({
          androidClientId: "764289968872-54s7r83tcdah8apinurbj1afh3l0f92u.apps.googleusercontent.com",
          iosClientId: "764289968872-8spc0amg0j9n4lqjs0rr99s75dmmkpc7.apps.googleusercontent.com",
          webClientId: "764289968872-tdema5ev8sf7djdjlp6a8is5k5mjrf5t.apps.googleusercontent.com",
          expoClientId: "764289968872-n5nrj6lbnv4vsc42mtso6u2mu1d7nsm5.apps.googleusercontent.com",
          scopes: ["https://www.googleapis.com/auth/contacts.readonly"], 
          redirectUri: makeRedirectUri({
            native: 'https://yay-api.herokuapp.com/mobile/oauth2callback',
            useProxy: true,
          }),
        });

        const [prompt1, setPrompt1] = useState('');
        const [prompt2, setPrompt2] = useState('');
        const [prompt3, setPrompt3] = useState('');
      
        const placeholderName = recipientFullName || 'your recipient';


        // Get the screen's height
const screenHeight = Dimensions.get('window').height

useEffect(() => {
  if (response?.type === 'success') {
    const { access_token } = response.params;

    // The access token is available in access_token
    console.log(access_token);

    // Handle the effect
    const handleEffect = async () => {
      const user = await getLocalUser();
      console.log("user", user);
      if (!user) {
        setToken(response.authentication.accessToken);
        getUserInfo(response.authentication.accessToken);
      } else {
        setUserInfo(user);
        console.log("loaded locally");
      }
    };

    // Call the handleEffect function
    handleEffect();
  }
}, [response, token]);

      
        const getLocalUser = async () => {
          const data = await AsyncStorage.getItem("@user");
          if (!data) return null;
          return JSON.parse(data);
        };
      
        const getUserInfo = async (token) => {
          if (!token) return;
          try {
            const response = await fetch(
              "https://www.googleapis.com/userinfo/v2/me",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
      
            const user = await response.json();
            await AsyncStorage.setItem("@user", JSON.stringify(user));
            setUserInfo(user);
          } catch (error) {
            // Add your own error handler here
          }
        };
          const showTableModal = () => {
            setIsTableModalVisible(true);
          };
          
          const handleTableModalOk = () => {
            setIsTableModalVisible(false);
          };
          
          const handleTableModalCancel = () => {
            setIsTableModalVisible(false);
          };
          ;

          const getContacts = async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
              const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
              });
              if (data.length > 0) {
                setContactsMobile(data);
                setModalVisible(true);
              }
            }
          };
          
          const addContactToList = async (contact, index) => {
            const newContact = {
              id: tableData.length + index + 1, // This will increment the ID for each new contact
              name: contact.names[0].displayName,
              emailAddresses: [{ value: prioritizeEmail(contact.emailAddresses) }], // Use the prioritizeEmail function here
              phoneNumber: '', // Changed "address" to "sms"
            };
          
            // Check if a contact with the same name already exists in the tableData
            if (tableData.some(existingContact => existingContact.name === newContact.name)) {
              console.log(`A contact with the name ${newContact.name} already exists.`);
              return;
            }
          
            // Add the new contact to the tableData state
            setTableData(prevTableData => [...prevTableData, newContact]);
          
            // Increment the contact count
            setContactCount(prevCount => prevCount + 1);
          };
          

      const prioritizeEmail = (emailAddresses) => {
        if (!emailAddresses || emailAddresses.length === 0) return '';
        const sortedEmails = emailAddresses.sort((a, b) => {
          if (a.value.endsWith('.com') && b.value.endsWith('.edu')) return -1;
          if (a.value.endsWith('.edu') && b.value.endsWith('.com')) return 1;
          return 0;
        });
        return sortedEmails[0].value;
      };


      const filteredContactsGoogle = googleContacts.filter(contact => {
        const hasEmail = contact.emailAddresses && contact.emailAddresses.length > 0;
        const matchesSearchTerm = contact.names && contact.names.some(name => name.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
        return hasEmail && matchesSearchTerm;
      });

    const handleSearch = (text) => {
      setSearchTerm(text);
    };

      useEffect(() => {
        // Define a function that updates localStorage
        const updateLocalStorage = (data) => {
          if (typeof window !== 'undefined') {
            AsyncStorage.setItem('csvData', JSON.stringify(data));
          }
        };

        // Set the function in state so it can be used outside of this effect
        setUpdateLocalStorageFunction(() => updateLocalStorage);
      }, []);



      // In your component's useEffect hook
      useEffect(() => {
      const isAuthenticating =  AsyncStorage.getItem('isAuthenticating');
      if (isAuthenticating === 'true') {
        setIsAuthenticated(true);
        AsyncStorage.removeItem('isAuthenticating'); // Remove the flag from local storage once it has been checked
      }
      }, []);

      const changeHandler = (event) => {
      // Passing file data (event.target.files[0]) to parse using Papa.parse
      console.log('event.target.files[0]', event.target.files[0])
      Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const rowsArray = [];
          const valuesArray = [];

          // Iterating data to get column name and their values
          results.data.map((d) => {
            rowsArray.push(Object.keys(d));
            valuesArray.push(Object.values(d));
          });

          // Parsed Data Response in array format
          setParsedData(results.data);

          // Filtered Column Names
          setTableRows(rowsArray[0]);

          // Filtered Values
          setValues(valuesArray);
          console.log('values = '+ values)
          console.log('parsedData = '+ parsedData)

          // Use the function from state to update AsyncStorage
          updateLocalStorageFunction(results.data);
        },
      });
      setCsvUploaded(true);
      };


      const handleContactSelect = (contact, isSelected) => {
      setSelectedContacts(prevSelectedContacts => {
        if (isSelected) {
          return [...prevSelectedContacts, contact];
        } else {
          return prevSelectedContacts.filter(c => c.resourceName !== contact.resourceName);
        }
      });
      };
    const addSelectedContactsToList = async () => {
        for (let i = 0; i < selectedContacts.length; i++) {
          await addContactToList(selectedContacts[i], i);
        }
        setSelectedContacts([]);
        setIsModalOpen(false);
      };


      async function fetchGoogleContacts(token) {
        try {
          if (!userInfo) {
            console.error('User info not found');
            return;
          }
      
          const tokens = token;
          console.log('tokens = '+ tokens);
          const response = await fetch('https://yay-api.herokuapp.com/mobile/getPeople', {
            headers: {
              'Authorization': `Bearer ${tokens}`,
            },
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          const contacts = await response.json();
          setGoogleContacts(contacts);
          console.log('Google Contacts:', contacts); // Log the contacts
          setIsModalOpen(true); // Open the modal once the contacts are fetched
        } catch (error) {
          console.error('Failed to fetch Google contacts:', error);
        }
      }
      

        function onSendSMS(time, recipient, gifter, to) {
          const url = 'https://yay-api.herokuapp.com/sms/sendSMS';
          const data = {
            time: time,
            recipient: recipient,
            gifter: gifter,
            to: to
          };
        
          fetch(url, {
            method: 'POST', 
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data), 
          })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch((error) => {
            console.error('Error:', error);
          });
        }




        const openEmailModal = () => {
          // Get the emails of people who have not yet contributed
          const nonContributors = dataSource.filter(student => student.submitted === "No").map(student => student.email);
          setEmailRecipients(nonContributors.join(', '));
          console.log('Non-contributors:', nonContributors);
          setEmailModalVisible(true);
        };
        
      
      
        
        const handleEmailModalCancel = () => {
          setEmailModalVisible(false);
        };
        

        const closeModal = () => {x
          setOpenGmail(false);
        };


        
        const renderRightActions = (contact, progress, dragX) => {
          const trans = dragX.interpolate({
            inputRange: [0, 50, 100, 101],
            outputRange: [-20, 0, 0, 1],
          });
        };
        

        const handleClose = () => {
          setShowModal(false);
        };

        const handleChangeUpload = (info) => {
          if (info.file.status !== "uploading") {
            console.log(info.file, info.fileList);

          }
          if (info.file.status === "done") {
            message.success(`${info.file.name} file uploaded successfully`);
            notification.success({
              message: 'Picture successfully uploaded',
              duration: 2,
            });
            setPictureSubmitted(true);
          } else if (info.file.status === "error") {
            message.error(`${info.file.name} file upload failed.`);
          }
        };

  
        const addtoList = async () => {
          let objects = [];
        
          for (let i = 0; i < values.length; i ++) {
            const newContact = {
              id: dataSource.length + i + 1, // This will increment the ID for each new contact
              name: values[i][1],
              email: values[i][2],
              sms: values[i][3], // Changed "address" to "sms"
            };
        
            // Check if a contact with the same name already exists in the dataSource
            const existingContactIndex = dataSource.findIndex(existingContact => existingContact.name === newContact.name);
            if (existingContactIndex !== -1) {
              console.log(`A contact with the name ${newContact.name} already exists.`);
              // If the new contact has a phone number, update the existing contact's phone number
              if (newContact.sms) {
                dataSource[existingContactIndex].sms = newContact.sms;
              }
              continue;
            }
        
            objects.push(newContact);
          }
        
          // Add the new contacts to the dataSource state
          setDataSource(prevDataSource => [...prevDataSource, ...objects]);
        
          // Increment the contact count by the number of new contacts
          setContactCount(prevCount => prevCount + objects.length);
        };
        
     
        const handleSelectContact = (contact, phoneNumber) => {  // Added phoneNumber as a parameter
          const contactWithPhoneNumber = { ...contact, phoneNumber };
        
          if (selectedContactsMobile.some((selectedContact) => selectedContact.id === contact.id && selectedContact.phoneNumber === phoneNumber)) {
            setSelectedContactsMobile((prev) => prev.filter((selectedContact) => selectedContact.id !== contact.id || selectedContact.phoneNumber !== phoneNumber));
          } else {
            setSelectedContactsMobile((prev) => [...prev, contactWithPhoneNumber]);
          }
        };
        
        
        const handleAddToList = () => { // phone contacts
          setTableData(prev => [...prev, ...selectedContactsMobile]);
          setSelectedContactsMobile([]);
          setModalVisible(false);
        };
        // const handleDeleteContact = (contactToDelete) => {
        //   setTableData((prevTableData) => {
        //     return prevTableData.filter(contact => contact.id !== contactToDelete.id);
        //   });
        // };
        
       
      const filteredContacts = contactsMobile.filter((contact) =>
      (contact.name && (contact.phoneNumbers && contact.phoneNumbers.length > 0 || contact.emails && contact.emails.length > 0)) && contact.name.toLowerCase().includes(searchTermMobile.toLowerCase())
    );

        const handleSendEmail = async () => {
          setIsSendingEmail(true);
          console.log('email sent')
          let token = AsyncStorage.getItem('token');
          if (!token) {
            // If the user is not signed in, prompt them to do so
            // You would need to implement this part based on how your sign-in system works
          } else {
            // If the user is signed in, send the email
            const recipientEmails = emailRecipients.split(',').map(email => email.trim());
        
            // Decode the JWT
            const decoded = jwt_decode(token);
        
            // Extract the sender's name and username from the decoded JWT
            const senderName = decoded.name;
            const senderEmail = decoded.username;
            const userID = decoded.userId;
        
            const response = await fetch('/api/sendEmail', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Use the new token
              },
              body: JSON.stringify({
                senderName,
                senderEmail,
                emailSubject, // Use the emailSubject state variable
                emailBody, // Use the emailBody state variable
                recipientEmails,
                userID,
              }),
            });
        
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            console.log('Email sent successfully');
            setIsSendingEmail(false);
            setEmailModalVisible(false);
            setShowSuccessModal(true);
        
            // Create a new date only if lastEmailSent is null
            let newDate;
            newDate = moment().toDate();
            AsyncStorage.setItem('lastEmailSent', newDate);
        
              // Update lastEmailed attribute in the backend
              await fetch(`https://yay-api.herokuapp.com/users/${userID}/lastEmailed`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  lastEmailed: newDate,
                }),
              });
        
              // Format the new date and update the lastEmailSent state variable
              setLastEmailSent(moment(newDate).format('MMMM Do, YYYY @ h:mm A'));
          }
        };
        


        const onEditStudent = (record) => {
          setIsEditing(true);
          setEditingStudent({ ...record });
        };
        
        

        const handleOk = async () => {
          setIsModalVisible(false);
        
          const newStudent = {
            id: dataSource.length + 1,
            name: name,
            email: email,
            submitted: submitted,
            submission: submission,
            picture: pictureSubmitted, // starts as an empty string
            notes: notes,
          };
        
          // Add the new student to the dataSource state
          setDataSource([...dataSource, newStudent]);
        
        }
        
        const prioritizeEmailGoogle = (emailAddresses) => {
          if (!emailAddresses || emailAddresses.length === 0) {
            return 'No email';
          }

          const priorityDomains = ['@outlook.com', '@gmail.com', '@hotmail.com'];
          
          // Sort email addresses based on the priority of the domain
          const sortedEmailAddresses = emailAddresses.sort((a, b) => {
            const aDomain = a.value.split('@')[1];
            const bDomain = b.value.split('@')[1];
            const aPriority = priorityDomains.includes(aDomain) ? 1 : 0;
            const bPriority = priorityDomains.includes(bDomain) ? 1 : 0;
            return bPriority - aPriority;
          });

          // Return the first email address in the sorted list
          return sortedEmailAddresses[0].value;
        };


        const handleCancel = () => {
          setIsModalVisible(false);
        };


 
        async function submitAndSendWelcomeMessage(contributors) {
          // Calculate the total amount to charge
          let totalAmount = 0;
          if (physicalBook) {
            totalAmount += 9900; // $99 in cents
          }
          if (includeAudio) {
            totalAmount += 1500; // $15 in cents
          }
        
          // If there's a charge, open the payment modal
          if (totalAmount > 0) {
            setTotalAmount(totalAmount);
            setIsPaymentModalVisible(true); // if payment method is sucessfull send messages the same way as if the user diddn't select includeAudio / physicalBook
          } else {
            // If there's no charge, send the welcome messages directly
            sendWelcomeMessages(contributors);
          }
        }
        
        async function sendWelcomeMessages(contributors) {
          // Prepare a group email for all contributors with an email address
          const emails = contributors.flatMap(contributor => contributor.emailAddresses || []).map(emailObj => emailObj.value);
          if (emails.length > 0) {
            const emailUrl = `mailto:${emails.join(',')}?subject=Welcome to the project!&body=Thank you for contributing to our project. We appreciate your support!`;
            Linking.openURL(emailUrl).catch(err => console.error('Failed to send email:', err));
          }
        
          // Prepare a group SMS for all contributors with a phone number
          const phones = contributors
            .map(contributor => contributor.phoneNumber.replace(/\D/g, ''))  // remove non-digit characters
            .filter(phone => phone);
          if (phones.length > 0) {
            const smsUrl = `sms:${phones.join(',')}?body=Thank you for contributing to our project. We appreciate your support!`;
            Linking.openURL(smsUrl).catch(err => console.error('Failed to send SMS:', err));
          }
        }
        
          const RenderRightActions = (progress, dragX, onPress) => {
            const scale = dragX.interpolate({
              inputRange: [-100, 0],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            });
            return (
              <TouchableOpacity onPress={onPress}>
                <View style={styles.deleteBox}>
                  <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>Delete</Animated.Text>
                </View>
              </TouchableOpacity>
            );
          };


          const handleDelete = (index) => {
            const newData = [...tableData];
            newData.splice(index, 1);
            setTableData(newData);
          };
        


  return (
    <View style={{ padding: 40, marginTop: 32 }}>

      {/* Modals */}

      {
        (physicalBook || includeAudio) ? (
          <PaymentModal
            isModalVisible={isPaymentModalVisible}
            setIsModalVisible={setIsPaymentModalVisible}
            totalAmount={totalAmount}
            contributors={contributors}  // Pass the contributors here
            physicalBook={physicalBook}
            includeAudio={includeAudio}
            gifterEmail={gifterEmail}
            sendWelcomeMessages={sendWelcomeMessages}
          />
        ) : null
      }



    <Modal visible={isModalVisible} transparent={true}>
        <View style={{ margin: 50, backgroundColor: 'gray', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center',}}>
            <Text>Add a new contributor manually</Text>
            <Text>Name</Text>
            <TextInput placeholder="Name" value={name} onChangeText={(text) => setName(text)} />
            <Text>Email</Text>
            <TextInput placeholder="Email" value={email} onChangeText={(text) => setEmail(text)} />
            <Text>Submitted</Text>
            <Picker selectedValue={submitted} onValueChange={(itemValue) => setSubmitted(itemValue)}>
                <Picker.Item label="Yes" value="yes" />
                <Picker.Item label="No" value="no" />
            </Picker>
            <Text>Submission</Text>
            <TextInput multiline={true} numberOfLines={10} maxLength={650} placeholder="Submission" value={submission} onChangeText={(text) => setSubmission(text)} />
            <Text>Picture Upload</Text>
            <Text>Notes</Text>
            <TextInput placeholder="Notes" value={notes} onChangeText={(text) => setNotes(text)} />
            <TouchableOpacity style={styles.button} onPress={handleOk}>
                <Text>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleCancel}>
                <Text>Cancel</Text>
            </TouchableOpacity>
        </View>
      
    </Modal>
    <Modal visible={isContributorsModalVisible} transparent={true}>
          <View style={{ 
            margin: 50, 
            height: screenHeight - 100,  // subtract the total margin from the screen height
            backgroundColor: 'gray', 
            borderRadius: 10, 
            padding: 10, 
            justifyContent: 'space-between'
          }}>
            <Text style={{ color: 'white', fontSize: 20 }}>Your Contributors ({tableData.length})</Text>
            <FlatList
              data={tableData}
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
                  <View style={{ flexGrow: 1 }}>
                    <Text style={{ color: 'white', fontSize: 12 }}>{item.name ? item.name : ''}</Text>
                    <Text style={{ color: 'white', fontSize: 10 }}>{prioritizeEmail(item.emailAddresses)}</Text>
                    <Text style={{ color: 'white', fontSize: 10 }}>{item.phoneNumber ? item.phoneNumber : ''}</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
                    <Text style={styles.deleteButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            <TouchableOpacity style={styles.button} onPress={() => setIsContributorsModalVisible(false)} >
              <Text style={styles.buttonText}>Close</Text> 
            </TouchableOpacity>
          </View>
        </Modal>


          <Modal visible={modalVisible} transparent={true}>
                  <View style={{ 
                        margin: 50, 
                        height: screenHeight - 100,  // subtract the total margin from the screen height
                        backgroundColor: 'gray', 
                        borderRadius: 10, 
                        padding: 10, 
                        justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: 'white', fontSize: 20  }}>Mobile Contact List:</Text>
                    <TextInput
                        style={{ height: 40, borderColor: 'black', borderWidth: 2, color: 'white' }}
                        onChangeText={setSearchTermMobile}
                        value={searchTermMobile}
                        placeholder="Search contacts"
                        placeholderTextColor="white"
                    />
                    <FlatList
                      data={filteredContacts}
                      contentContainerStyle={{ padding: 2 }}
                      keyExtractor={(item, index) => item.id + index}  // Modified keyExtractor
                      renderItem={({ item }) => (
                        // Map over phoneNumbers array
                        item.phoneNumbers && item.phoneNumbers.map((phoneNumber, index) => (
                          <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Switch
                            value={selectedContactsMobile.some((selectedContact) => selectedContact.id === item.id && selectedContact.phoneNumber === phoneNumber.number)}
                            onValueChange={() => handleSelectContact(item, phoneNumber.number)}  
                            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }} 
                          />

                            <Text style={{ color: 'white', fontSize: 10 }}>
                              {item.name} ({phoneNumber.label || 'Unknown'}) {phoneNumber.number || 'No phone number'}
                            </Text>
                          </View>
                        ))
                      )}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleAddToList} color="white" >
                        <Text style={styles.buttonText}>Add phone numbers to list</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)} color="white">
                        <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity> 
                </View>
            </Modal>

            <Modal visible={isModalOpen} transparent={true}>
              <View style={{ 
                margin: 50, 
                height: screenHeight - 100,  // subtract the total margin from the screen height
                backgroundColor: 'gray', 
                borderRadius: 10, 
                padding: 10, 
                justifyContent: 'space-between'
              }}>             
                <Text style={{ color: 'white', fontSize: 20 }}>Google Contact List:</Text>
                <TextInput
                  style={{ height: 40, borderColor: 'black', borderWidth: 2, color: 'white' }}
                  onChangeText={handleSearch}
                  placeholder="Search contacts"
                  placeholderTextColor="white"
                />
                <ScrollView>
                  {filteredContactsGoogle.map(contact => {
                    // Check if the contact has an email
                    const email = prioritizeEmailGoogle(contact.emailAddresses);
                    if (email == "No email") {
                      // If the contact doesn't have an email, don't render anything
                      return null;
                    }

                    // If the contact has an email, render the contact
                    return (
                      <View key={contact.resourceName} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Switch
                          value={selectedContacts.includes(contact)}
                          onValueChange={isChecked => handleContactSelect(contact, isChecked)}
                          style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }} 
                        />
                        <Text style={{ color: 'white', fontSize: 9 }}>
                          {contact.names && contact.names.length > 0 ? contact.names[0].displayName : 'Unnamed Contact'} | {email}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={styles.button} onPress={addSelectedContactsToList} >
                  <Text style={styles.buttonText}>Add Emails to list</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setIsModalOpen(false)} >
                  <Text style={styles.buttonText}>Close</Text> 
                </TouchableOpacity>
              </View>
            </Modal>

    <ScrollView style={styles.container}>
              <View style={styles.container} contentContainerStyle={{ alignItems: 'center' }} >
              <View style={styles.section}>
                  <Text style={styles.title}>Your Bundl Gift</Text>
                  <Text style={styles.subtitle}>Write out the recipient of the gift, the people who will contribute to the gift, and the message you will send to the contributors.</Text>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Your full name</Text>
                      <TextInput
                          style={styles.input}
                          value={gifterFullName}
                          onChangeText={setGifterFullName}
                          placeholder="Your full name"
                      />
                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Your email address</Text>
                      <TextInput
                          style={styles.input}
                          value={gifterEmail}
                          type="email"
                          onChangeText={setGifterEmail}
                          placeholder="Your email address"
                      />
                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Recipient's full name</Text>
                      <TextInput
                          style={styles.input}
                          value={recipientFullName}
                          onChangeText={setRecipientFullName}
                          placeholder="Your recipient's full name"
                      />
                  </View>

                  <View style={styles.inputContainer}>

                  <Text style={styles.label}>Prompts for contributors</Text>
                  <View style={styles.inputContainer}>
                      <TextInput
                          style={styles.input}
                          value={prompt1}
                          onChangeText={setPrompt1}
                          placeholder={`1. What is your favorite thing about ${placeholderName}?`}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <TextInput
                          style={styles.input}
                          value={prompt2}
                          onChangeText={setPrompt2}
                          placeholder={`2. What positive thing have you learned from ${placeholderName}?`}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <TextInput
                          style={styles.input}
                          value={prompt3}
                          onChangeText={setPrompt3}
                          placeholder={`3. What is your favorite memory with ${placeholderName}?`}
                      />
                  </View>
                </View>

                  <View style={styles.container}>
                
                    <TouchableOpacity  style={styles.button} onPress={() => setIsContributorsModalVisible(true)}>
                      <Text style={styles.buttonText} >View selected contributors ({tableData.length})</Text>
                    </TouchableOpacity>
                    </View>


                  <View style={styles.buttonContainer} >
                      <TouchableOpacity style={styles.button} onPress={getContacts}>
                          <Text style={styles.buttonText}>Select from your phone contacts</Text>
                      </TouchableOpacity> 

                      <View style={styles.container}>
                          {!userInfo ? (
                              <TouchableOpacity
                                  style={styles.button}
                                  disabled={!request}
                                  onPress={() => {
                                      promptAsync();
                                  }}
                              >
                                  <Text style={styles.buttonText}>Select your Google Contacts</Text>
                              </TouchableOpacity>
                          ) : (
                              <View>
                                  <TouchableOpacity
                                      style={styles.button}
                                      onPress={() => fetchGoogleContacts(response.params.access_token)}
                                  >
                                      <Text style={styles.buttonText}>View your Google Contacts</Text>
                                  </TouchableOpacity>
                              </View>
                          )}
                      </View>

                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Welcome Message</Text>
                      <ScrollView>
                      <TextInput
                          style={styles.textarea}
                          value={message}
                          onChangeText={setMessage}
                          multiline
                          numberOfLines={3}
                      />
                      </ScrollView>
                  </View>

                  <View style={styles.buttonContainer}>

                  <View style={{flexDirection: 'column', alignItems: 'center'}}>
                  <Switch
                    value={includeAudio}
                    onValueChange={setIncludeAudio}
                  />
                  <Text>Pay $15 to allow your contributors to record audio in addition to text and pictures</Text>
                </View>

                  <View style={{flexDirection: 'column', alignItems: 'center'}}>
                  <Switch
                    value={physicalBook}
                    onValueChange={setPhysicalBook}
                  />
                  <Text>Pay $99 to make this e-book a physical book</Text>
                </View>

                <TouchableOpacity 
                style={styles.button} onPress={() => submitAndSendWelcomeMessage(tableData)}
                disabled={selectedContactsMobile.length === 0 && selectedContacts.length === 0} 
                >
                <Text style={styles.buttonText}>
                  {selectedContactsMobile.length > 0 && selectedContacts.length > 0
                    ? 'Text and email welcome message to selected contributors'
                    : selectedContactsMobile.length > 0
                    ? 'Text welcome message to selected contributors'
                    : selectedContacts.length > 0
                    ? 'Email welcome message to selected contributors'
                    : 'Select contributors'}
                </Text>
              </TouchableOpacity>
                  </View>
              </View>
              </View >
      </ScrollView>
    
  </View>


  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  cardField: {
    height: 50,
    marginTop: 30,
    width: '100%',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
  },
  textStyle: {
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    border: '3px solid black',
  },
  cardText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20, // consistent margin for all sections
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
  },
  inputContainer: {
    marginTop: 10, // consistent margin for all input containers
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  textarea: {
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  buttonContainer: {
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    flexDirection: 'column', // stack buttons vertically
  },
  button: {
    backgroundColor: '#FF7F7F', // light red
    paddingHorizontal: 10,
    justifyContent: 'center', // align text vertically in the center
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  itemContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'transparent', 
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    },
    deleteButton: {
      backgroundColor: 'red', // Choose the color you prefer
      width: 20, // Adjust the width and height to modify the size of the square
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5,
      marginLeft: 10, // Add some margin if you want some space between the text and the button
    },
    deleteButtonText: {
      color: 'white', // Choose the color you prefer
      fontSize: 16, // Adjust the font size to make the "X" smaller or larger
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
  },
});
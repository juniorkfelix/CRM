import * as React from 'react';
import CRMRoot from '../../window-context-service.jsx';

const TwoFAEnrollmentWelcome: React.FunctionComponent<{nextButtonEventHandler: Function}> = ({ nextButtonEventHandler}) => {
    return (
        <div>
             <div className="col-lg-12">
                    <div className="box" id="TwoFAEnrollmentSteps">
                        <div className="box-body">
                            <div className="callout callout-warning">
                                <p>{window.i18next.t("When you click next, you'll be prompted to scan a QR code to enroll your authenticator app.")}<br/>{window.i18next.t("This will invalidate any previously configured 2 factor apps / devices")}</p>
                            </div>
                            <p>{window.i18next.t("Enrolling your ChurchCRM user account in Two Factor Authention provides an additional layer of defense against bad actors trying to access your account.")}</p>
                            <hr/>
                            <div className="col-lg-4">
                                <i className="fa fa-id-card-o"></i>
                                <p>{window.i18next.t("When you sign in to ChurchCRM, you'll still enter your username and password like normal")}</p>
                            </div>
                            <div className="col-lg-4">
                                <i className="fa fa-key"></i>
                                <p>{window.i18next.t("However, you'll also need to supply a one-time code from your authenticator device to complete your login")}</p>
                            </div>
                            <div className="col-lg-4">
                                <i className="fa fa-check-square-o"></i>
                                <p>{window.i18next.t("After successfully entering both your credentials, and the one-time code, you'll be logged in as normal")}</p>
                            </div>
                            <div className="clearfix"></div>
                            <div className="callout callout-info">
                                <p>{window.i18next.t("ChurchCRM Two factor supports any TOTP authenticator app, so you're free to choose between Microsoft Authenticator, Google Authenticator, Authy, LastPass, and others")}</p>
                            </div>
                            <button className="btn btn-success" onClick={() => {nextButtonEventHandler()}}>{window.i18next.t("Begin Two Factor Authentication Enrollment")}</button>
                    </div>
                </div>
            </div>
        </div>

    )
}

const TwoFAEnrollmentGetQR: React.FunctionComponent<{TwoFAQRCodeDataUri: string, newQRCode:Function, remove2FA:Function, validationCodeChangeHandler:(event: React.ChangeEvent<HTMLInputElement>) => void, currentTwoFAPin?:string, currentTwoFAPinStatus:string }> = ({TwoFAQRCodeDataUri, newQRCode, remove2FA, validationCodeChangeHandler, currentTwoFAPin, currentTwoFAPinStatus}) => {
    return (
        <div>
             <div className="col-lg-12">
                    <div className="box">
                        <div className="box-header">
                            <h4>{window.i18next.t("2 Factor Authentication Secret")}</h4>
                        </div>
                        <div className="box-body">
                          <div className="col-lg-6">
                            <img src={TwoFAQRCodeDataUri} />
                          </div>
                          <div className="col-lg-6">
                            <div className="row">
                              <div className="col-lg-6">
                                <button className="btn btn-warning" onClick={() => {newQRCode()}}>{window.i18next.t("Regenerate 2 Factor Authentication Secret")}</button>
                              </div>
                              <div className="col-lg-6">
                                <button className="btn btn-warning" onClick={() => {remove2FA()}}>{window.i18next.t("Remove 2 Factor Authentication Secret")}</button>
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-lg-12">
                                <label>
                                  {window.i18next.t("Enter TOTP code to confirm enrollment")}:
                                  <input onChange={validationCodeChangeHandler} value={currentTwoFAPin} />
                                </label>
                                <p>{currentTwoFAPinStatus}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                </div>
        </div>
    )
}


class UserTwoFactorEnrollment extends React.Component<TwoFactorEnrollmentProps, TwoFactorEnrollmentState> {
    constructor(props: TwoFactorEnrollmentProps) {
      super(props);

      this.state = {
        currentView: "intro",
        TwoFARecoveryCodes: []
      }

      this.nextButtonEventHandler = this.nextButtonEventHandler.bind(this);
      this.requestNew2FABarcode = this.requestNew2FABarcode.bind(this);
      this.remove2FAForuser = this.remove2FAForuser.bind(this);
      this.validationCodeChangeHandler = this.validationCodeChangeHandler.bind(this);
      this.requestNew2FARecoveryCodes = this.requestNew2FARecoveryCodes.bind(this);
    }

    nextButtonEventHandler() {
      this.requestNew2FABarcode();
      this.setState({
        currentView:"BeginEnroll"
      });
    }

    requestNew2FABarcode() {
      fetch(CRMRoot + '/api/user/current/refresh2fasecret', {
        credentials: "include",
        method: "POST",
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(data => {
          this.setState({ TwoFAQRCodeDataUri: data.TwoFAQRCodeDataUri })
        });
    }

    requestNew2FARecoveryCodes() {
      fetch(CRMRoot + '/api/user/current/refresh2farecoverycodes', {
        credentials: "include",
        method: "POST",
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(data => {
          this.setState({ TwoFARecoveryCodes: data.TwoFARecoveryCodes })
        });
    }

    remove2FAForuser() {
      fetch(CRMRoot + '/api/user/current/remove2fasecret', {
        credentials: "include",
        method: "POST",
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(data => {
          this.setState({ 
            TwoFAQRCodeDataUri: "",
            currentView: "intro"
          })
        });
    }

    validationCodeChangeHandler(event: React.ChangeEvent<HTMLInputElement> ) {
      this.setState({
        currentTwoFAPin: event.currentTarget.value
      });
      if(event.currentTarget.value.length == 6) {
        console.log("Checking for valid pin");
        fetch(CRMRoot + "/api/user/current/test2FAEnrollmentCode", {
          credentials: "include",
          method: "POST",
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({enrollmentCode: event.currentTarget.value})
        })
        .then(response => response.json())
        .then(data => {
          if (data.IsEnrollmentCodeValid ) {
            this.requestNew2FARecoveryCodes();
            this.setState({
              currentView: "success"
            });
          }
          else{
            this.setState({
              currentTwoFAPinStatus: "invalid"
            });
          }
         
        });
        this.setState({
          currentTwoFAPinStatus: "pending"
        })

      }
      else{
        this.setState({
          currentTwoFAPinStatus: "incomplete"
        })
      }
    }
    

    render() {  
        if (this.state.currentView === "intro") {
            return (
                <div>
                    <div className="row">
                        <TwoFAEnrollmentWelcome nextButtonEventHandler = { this.nextButtonEventHandler}  />                    
                    </div>
                </div >
            );
        }
        else if(this.state.currentView === "BeginEnroll") {
            return (
                <div>
                    
                    <div className="row">
                        <TwoFAEnrollmentGetQR TwoFAQRCodeDataUri={this.state.TwoFAQRCodeDataUri} newQRCode={this.requestNew2FABarcode} remove2FA={this.remove2FAForuser}  validationCodeChangeHandler={this.validationCodeChangeHandler } currentTwoFAPin={this.state.currentTwoFAPin} currentTwoFAPinStatus={this.state.currentTwoFAPinStatus} />               
                    </div>
                </div >
            );
        }
        else if(this.state.currentView === "success") {
          return (
            <div>
              <h4>Success</h4>
              <ul>{this.state.TwoFARecoveryCodes.length ? (this.state.TwoFARecoveryCodes.map((code) => <li>{code}</li>)) : <p>waiting</p>}</ul>
            </div>
          )
        }
        else {
          return (
            <h4>Uh-oh</h4>
          )
        }
    }
}

interface TwoFactorEnrollmentProps {

}

interface TwoFactorEnrollmentState {
  currentView: string,
  TwoFAQRCodeDataUri?: string,
  currentTwoFAPin?: string,
  currentTwoFAPinStatus?: string,
  TwoFARecoveryCodes: string[]
}
export default UserTwoFactorEnrollment;
#region Copyright (c) 2002-2003, James W. Newkirk, Michael C. Two, Alexei A. Vorontsov, Charlie Poole, Philip A. Craig
/************************************************************************************
'
' Copyright © 2002-2003 James W. Newkirk, Michael C. Two, Alexei A. Vorontsov, Charlie Poole
' Copyright © 2000-2003 Philip A. Craig
'
' This software is provided 'as-is', without any express or implied warranty. In no 
' event will the authors be held liable for any damages arising from the use of this 
' software.
' 
' Permission is granted to anyone to use this software for any purpose, including 
' commercial applications, and to alter it and redistribute it freely, subject to the 
' following restrictions:
'
' 1. The origin of this software must not be misrepresented; you must not claim that 
' you wrote the original software. If you use this software in a product, an 
' acknowledgment (see the following) in the product documentation is required.
'
' Portions Copyright © 2003 James W. Newkirk, Michael C. Two, Alexei A. Vorontsov, Charlie Poole
' or Copyright © 2000-2003 Philip A. Craig
'
' 2. Altered source versions must be plainly marked as such, and must not be 
' misrepresented as being the original software.
'
' 3. This notice may not be removed or altered from any source distribution.
'
'***********************************************************************************/
#endregion

using System;
using System.Collections;
using System.ComponentModel;

namespace PiLot.Utils { // changed from the original, but left functionality more or less the same

	public class Assert {

		/// <summary>
		/// A private constructor disallows any instances of this Object. 
		/// </summary>
		private Assert() { }

		/// <summary>
		/// Asserts that a pCondition is true. If the pCondition is false the method throws
		/// an AssertionException.
		/// </summary> 
		/// <param name="pMessage">The pMessage to display if the pCondition is false</param>
		/// <param name="pCondition">The evaluated pCondition</param>
		static public void IsTrue(Boolean pCondition, String pMessage) {
			if (!pCondition) {
				Assert.Fail(pMessage);
			}
		}

		static public void IsTrue(Boolean pCondition, String pMessage, Object pArg1) {
			if (!pCondition) {
				Assert.Fail(pMessage, pArg1);
			}
		}

		static public void IsTrue(Boolean pCondition, String pMessage, Object pArg1, Object pArg2) {
			if (!pCondition) {
				Assert.Fail(pMessage, pArg1, pArg2);
			}
		}

		static public void IsTrue(Boolean pCondition, String pMessage, Object pArg1, Object pArg2, Object pArg3) {
			if (!pCondition) {
				Assert.Fail(pMessage, pArg1, pArg2, pArg3);
			}
		}

		/// <summary>
		/// Asserts that a pCondition is true. If the pCondition is false the method throws
		/// an AssertionException.
		/// </summary>
		/// <param name="pCondition">The evaluated pCondition</param>
		static public void IsTrue(Boolean pCondition) {
			Assert.IsTrue(pCondition, String.Empty);
		}

		/// <summary>
		/// Asserts that a pCondition is false. If the pCondition is true the method throws
		/// an <see cref="AssertionException"/>.
		/// </summary>
		/// <param name="pCondition">The evaluated pCondition</param>
		/// <param name="pMessage">The pMessage to display if the pCondition is true</param>
		static public void IsFalse(Boolean pCondition, String pMessage) {
			if (pCondition) {
				Assert.Fail(pMessage);
			}
		}

		static public void IsFalse(Boolean pCondition, String pMessage, Object pArg1) {
			if (pCondition) {
				Assert.Fail(pMessage, pArg1);
			}
		}

		static public void IsFalse(Boolean pCondition, String pMessage, Object pArg1, Object pArg2) {
			if (pCondition) {
				Assert.Fail(pMessage, pArg1, pArg2);
			}
		}

		static public void IsFalse(Boolean pCondition, String pMessage, Object pArg1, Object pArg2, Object pArg3) {
			if (pCondition) {
				Assert.Fail(pMessage, pArg1, pArg2, pArg3);
			}
		}

		/// <summary>
		/// Asserts that a pCondition is false. If the pCondition is true the method throws
		/// an <see cref="AssertionException"/>.
		/// </summary>
		/// <param name="pCondition">The evaluated pCondition</param>
		static public void IsFalse(Boolean pCondition) {
			Assert.IsFalse(pCondition, String.Empty);
		}

		/// <summary>
		/// Checks whether an object is of a certain type (or subtype)
		/// </summary>
		/// <typeparam name="T">the required type</typeparam>
		/// <param name="pObject">The object to be tested</param>
		/// <param name="pMessage">The error message if the type does not match</param>
		static public void IsTypeOf<T>(Object pObject, String pMessage) {
			if (!(pObject is T)) {
				Assert.Fail(pMessage);
			}
		}

		/// <summary>
		/// Checks whether an object is of a certain type (or subtype).
		/// </summary>
		/// <typeparam name="T">the required type</typeparam>
		/// <param name="pObject">the object to be tested</param>
		static public void IsTypeOf<T>(Object pObject) {
			if (!(pObject is T)) {
				Assert.Fail(String.Format("Wrong type. Expected type: {0}, actual type: {1}", typeof(T).FullName, pObject.GetType().FullName));
			}
		}

		static public void IsTypeOf<T>(Object pObject, String pMessage, Object pArg1) {
			if (!(pObject is T)) {
				Assert.Fail(pMessage, pArg1);
			}
		}

		static public void IsTypeOf<T>(Object pObject, String pMessage, Object pArg1, Object pArg2) {
			if (!(pObject is T)) {
				Assert.Fail(pMessage, pArg1, pArg2);
			}
		}

		static public void IsTypeOf<T>(Object pObject, String pMessage, Object pArg1, Object pArg2, Object pArg3) {
			if (!(pObject is T)) {
				Assert.Fail(pMessage, pArg1, pArg2, pArg3);
			}
		}

		/// <summary>
		/// Verifies that two Decimals are equal. If 
		/// they are not equal then an <see cref="AssertionException"/> is
		/// thrown.
		/// </summary>
		/// <param name="pMessage">The pMessage prInt32ed out upon failure</param>
		/// <param name="pExpected">The pExpected value</param>
		/// <param name="pActual">The pActual value</param>
		static public void AreEqual(Decimal pExpected, Decimal pActual, String pMessage) {
			if (!(pExpected == pActual)) {
				Assert.FailNotEquals(pExpected, pActual, pMessage);
			}
		}

		/// <summary>
		/// Verifies that two Decimals are equal. If 
		/// they are not equals then an <see cref="AssertionException"/> is
		/// thrown.
		/// </summary>
		/// <param name="pExpected">The pExpected value</param>
		/// <param name="pActual">The pActual value</param>
		static public void AreEqual(Decimal pExpected, Decimal pActual) {
			Assert.AreEqual(pExpected, pActual, String.Empty);
		}

		/// <summary>
		/// Verifies that two Int32s are equal. If 
		/// they are not equals then an <see cref="AssertionException"/> is
		/// thrown.
		/// </summary>
		/// <param name="pMessage">The pMessage prInt32ed out upon failure</param>
		/// <param name="pExpected">The pExpected value</param>
		/// <param name="pActual">The pActual value</param>
		static public void AreEqual(Int32 pExpected, Int32 pActual, String pMessage) {
			if (!(pExpected == pActual)) {
				Assert.FailNotEquals(pExpected, pActual, pMessage);
			}
		}

		/// <summary>
		/// Verifies that two Int32s are equal. If 
		/// they are not equals then an <see cref="AssertionException"/> is
		/// thrown.
		/// </summary>
		/// <param name="pExpected">The pExpected value</param>
		/// <param name="pActual">The pActual value</param>
		static public void AreEqual(Int32 pExpected, Int32 pActual) {
			Assert.AreEqual(pExpected, pActual, String.Empty);
		}

		/// <summary>
		/// Verifies that two Objects are equal.  Two Objects are considered
		/// equal if both are null, or if both have the same value.  All
		/// non-numeric types are compared by using the <c>Equals</c> method.
		/// If they are not equal an <see cref="AssertionFailedError"/> is thrown.
		/// </summary>
		/// <param name="pExpected">The value that is pExpected</param>
		/// <param name="pActual">The pActual value</param>
		/// <param name="pMessage">The pMessage to display if Objects are not equal</param>
		static public void AreEqual(Object pExpected, Object pActual, String pMessage) {
			if (pExpected == null && pActual == null) return;
			if (pExpected != null && pActual != null) {
				if (ObjectsEqual(pExpected, pActual)) {
					return;
				}
			}
			Assert.FailNotEquals(pExpected, pActual, pMessage);
		}

		/// <summary>
		/// Verifies that two Objects are equal.  Two Objects are considered
		/// equal if both are null, or if both have the same value.  All
		/// non-numeric types are compared by using the <c>Equals</c> method.
		/// If they are not equal an <see cref="AssertionFailedError"/> is thrown.
		/// </summary>
		/// <param name="pExpected">The value that is pExpected</param>
		/// <param name="pActual">The pActual value</param>
		static public void AreEqual(Object pExpected, Object pActual) {
			Assert.AreEqual(pExpected, pActual, String.Empty);
		}

		/// <summary>
		/// The Equals method throws an AssertionException. This is done 
		/// to make sure there is no mistake by calling this function.
		/// </summary>
		/// <param name="a"></param>
		/// <param name="b"></param>
		[EditorBrowsable(EditorBrowsableState.Never)]
		public static new Boolean Equals(Object a, Object b) {
			throw new AssertionException("Assert.Equals should not be used for Assertions");
		}

		/// <summary>
		/// override the default ReferenceEquals to throw an AssertionException. This 
		/// implementation makes sure there is no mistake in calling this function 
		/// as part of Assert. 
		/// </summary>
		/// <param name="a"></param>
		/// <param name="b"></param>
		public static new void ReferenceEquals(Object a, Object b) {
			throw new AssertionException("Assert.ReferenceEquals should not be used for Assertions");
		}

		/// <summary>
		/// Checks the type of the Object, returning true if
		/// the Object is a numeric type.
		/// </summary>
		/// <param name="pObj">The Object to check</param>
		/// <returns>true if the Object is a numeric type</returns>
		static private Boolean IsNumericType(Object pObj) {
			if (null != pObj) {
				if (pObj is byte) return true;
				if (pObj is sbyte) return true;
				if (pObj is Decimal) return true;
				if (pObj is double) return true;
				if (pObj is float) return true;
				if (pObj is int) return true;
				if (pObj is uint) return true;
				if (pObj is long) return true;
				if (pObj is short) return true;
				if (pObj is ushort) return true;

				if (pObj is System.Byte) return true;
				if (pObj is System.SByte) return true;
				if (pObj is System.Decimal) return true;
				if (pObj is System.Double) return true;
				if (pObj is System.Single) return true;
				if (pObj is System.Int32) return true;
				if (pObj is System.UInt32) return true;
				if (pObj is System.Int64) return true;
				if (pObj is System.UInt64) return true;
				if (pObj is System.Int16) return true;
				if (pObj is System.UInt16) return true;
			}
			return false;
		}

		/// <summary>
		/// Used to compare numeric types.  Comparisons between
		/// same types are fine (Int32 to Int32, or Int64 to Int64),
		/// but the Equals method fails across different types.
		/// This method was added to allow any numeric type to
		/// be handled correctly, by using <c>ToString</c> and
		/// comparing the result
		/// </summary>
		/// <param name="pExpected"></param>
		/// <param name="pActual"></param>
		/// <returns></returns>
		static private Boolean ObjectsEqual(Object pExpected, Object pActual) {
			if (Assert.IsNumericType(pExpected) && Assert.IsNumericType(pActual)) {
				//
				// Convert to Strings and compare result to avoid
				// issues with different types that have the same
				// value
				//
				String sExpected = pExpected.ToString();
				String sActual = pActual.ToString();
				return sExpected.Equals(sActual);
			}
			return pExpected.Equals(pActual);
		}

		/// <summary>
		/// Verifies that the Object that is passed in is not equal to <code>null</code>
		/// If the Object is not <code>null</code> then an <see cref="AssertionException"/>
		/// is thrown.
		/// </summary>
		/// <param name="pMessage">The pMessage to be prInt32ed when the Object is null</param>
		/// <param name="pObject">The Object that is to be tested</param>
		static public void IsNotNull(Object pObject, String pMessage) {
			Assert.IsTrue(pObject != null, pMessage);
		}

		static public void IsNotNull(Object pObject, String pMessage, Object pArg1) {
			Assert.IsTrue(pObject != null, pMessage, pArg1);
		}

		static public void IsNotNull(Object pObject, String pMessage, Object pArg1, Object pArg2) {
			Assert.IsTrue(pObject != null, pMessage, pArg1, pArg2);
		}

		static public void IsNotNull(Object pObject, String pMessage, Object pArg1, Object pArg2, Object pArg3) {
			Assert.IsTrue(pObject != null, pMessage, pArg1, pArg2, pArg3);
		}

		/// <summary>
		/// Verifies that the Object that is passed in is not equal to <code>null</code>
		/// If the Object is not <code>null</code> then an <see cref="AssertionException"/>
		/// is thrown.
		/// </summary>
		/// <param name="pObject">The Object that is to be tested</param>
		static public void IsNotNull(Object pObject) {
			Assert.IsNotNull(pObject, String.Empty);
		}

		/// <summary>
		/// Verifies that the Object that is passed in is equal to <code>null</code>
		/// If the Object is <code>null</code> then an <see cref="AssertionException"/>
		/// is thrown.
		/// </summary>
		/// <param name="pMessage">The pMessage to be prInt32ed when the Object is not null</param>
		/// <param name="pObject">The Object that is to be tested</param>
		static public void IsNull(Object pObject, String pMessage) {
			Assert.IsTrue(pObject == null, pMessage);
		}

		static public void IsNull(Object pObject, String pMessage, Object pArg1) {
			Assert.IsTrue(pObject == null, pMessage, pArg1);
		}

		static public void IsNull(Object pObject, String pMessage, Object pArg1, Object pArg2) {
			Assert.IsTrue(pObject == null, pMessage, pArg1, pArg2);
		}

		static public void IsNull(Object pObject, String pMessage, Object pArg1, Object pArg2, Object pArg3) {
			Assert.IsTrue(pObject == null, pMessage, pArg1, pArg2, pArg3);
		}

		/// <summary>
		/// Verifies that the Object that is passed in is equal to <code>null</code>
		/// If the Object is <code>null</code> then an <see cref="AssertionException"/>
		/// is thrown.
		/// </summary>
		/// <param name="anObject">The Object that is to be tested</param>
		static public void IsNull(Object anObject) {
			Assert.IsNull(anObject, String.Empty);
		}

		/// <summary>
		/// Asserts that two Objects refer to the same Object. If they
		/// are not the same an <see cref="AssertionException"/> is thrown.
		/// </summary>
		/// <param name="pMessage">The pMessage to be prInt32ed when the two Objects are not the same Object.</param>
		/// <param name="pExpected">The pExpected Object</param>
		/// <param name="pActual">The pActual Object</param>
		static public void AreSame(Object pExpected, Object pActual, String pMessage) {
			if (Object.ReferenceEquals(pExpected, pActual)) {
				return;
			}
			Assert.FailNotSame(pExpected, pActual, pMessage);
		}

		/// <summary>
		/// Asserts that two Objects refer to the same Object. If they
		/// are not the same an <see cref="AssertionException"/> is thrown.
		/// </summary>
		/// <param name="pExpected">The pExpected Object</param>
		/// <param name="pActual">The pActual Object</param>
		static public void AreSame(Object pExpected, Object pActual) {
			Assert.AreSame(pExpected, pActual, String.Empty);
		}

		/// <summary>
		/// Asserts that two Objects don't refer to the same Object. If they
		/// are the same an <see cref="AssertionException"/> is thrown.
		/// </summary>
		/// <param name="pMessage">The pMessage to be prInt32ed when the two Objects are the same Object.</param>
		/// <param name="pExpected">The pExpected Object</param>
		/// <param name="pActual">The pActual Object</param>
		static public void AreNotSame(Object pExpected, Object pActual, String pMessage) {
			if (!Object.ReferenceEquals(pExpected, pActual)) {
				return;
			}
			Assert.Fail(pMessage);
		}

		/// <summary>
		/// Throws an <see cref="AssertionException"/> with the pMessage that is 
		/// passed in. This is used by the other Assert functions. 
		/// </summary>
		/// <param name="pMessage">The pMessage to initialize the <see cref="AssertionException"/> with.</param>
		static public void Fail(String pMessage) {
			if (pMessage == null) {
				pMessage = String.Empty;
			}
			throw new AssertionException(pMessage);
		}

		/// <summary>
		/// Throws an <see cref="AssertionException"/> with the pMessage that is 
		/// passed in. pMessage will be String.formatted with pMessage and pArg1
		/// </summary>
		/// <param name="pMessage">The pMessage to initialize the <see cref="AssertionException"/> with.</param>
		static public void Fail(String pMessage, Object pArg1) {
			if (pMessage == null) {
				pMessage = String.Empty;
			}
			throw new AssertionException(String.Format(pMessage, pArg1));
		}

		/// <summary>
		/// Throws an <see cref="AssertionException"/> with the pMessage that is 
		/// passed in. pMessage will be String.formatted with pMessage and pArg1, pArg2
		/// </summary>
		/// <param name="pMessage">The pMessage to initialize the <see cref="AssertionException"/> with.</param>
		static public void Fail(String pMessage, Object pArg1, Object pArg2) {
			if (pMessage == null) {
				pMessage = String.Empty;
			}
			throw new AssertionException(String.Format(pMessage, pArg1, pArg2));
		}

		/// <summary>
		/// Throws an <see cref="AssertionException"/> with the pMessage that is 
		/// passed in. pMessage will be String.formatted with pMessage and pArg1, pArg2
		/// </summary>
		/// <param name="pMessage">The pMessage to initialize the <see cref="AssertionException"/> with.</param>
		static public void Fail(String pMessage, Object pArg1, Object pArg2, Object pArg3) {
			if (pMessage == null) {
				pMessage = String.Empty;
			}
			throw new AssertionException(String.Format(pMessage, pArg1, pArg2, pArg3));
		}

		/// <summary>
		/// Throws an <see cref="AssertionException"/> with the pMessage that is 
		/// passed in. This is used by the other Assert functions. 
		/// </summary>
		static public void Fail() {
			Assert.Fail(String.Empty);
		}

		/// <summary>
		/// This method is called when two Objects have been compared and found to be
		/// different. This prInt32s a nice pMessage to the screen. 
		/// </summary>
		/// <param name="pMessage">The pMessage that is to be prInt32ed prior to the comparison failure</param>
		/// <param name="pExpected">The pExpected Object</param>
		/// <param name="pActual">The pActual Object</param>
		static private void FailNotEquals(Object pExpected, Object pActual, String pMessage) {
			Assert.Fail(pMessage);
		}

		/// <summary>
		///  This method is called when the two Objects are not the same. 
		/// </summary>
		/// <param name="pMessage">The pMessage to be prInt32ed on the screen</param>
		/// <param name="pExpected">The pExpected Object</param>
		/// <param name="pActual">The pActual Object</param>
		static private void FailNotSame(Object pExpected, Object pActual, String pMessage) {
			String formatted = String.Empty;
			if (pMessage != null) {
				formatted = pMessage + " ";
			}
			Assert.Fail(formatted + "pExpected same");
		}
	}
}
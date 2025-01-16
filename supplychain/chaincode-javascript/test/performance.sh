#!/bin/bash

# Set the path to your Fabric binaries
export FABRIC_BIN="/home/kokora/fabric-samples/bin"

# Set the channel name
CHANNEL_NAME="channel1"

# Set the chaincode name
CHAINCODE_NAME="role"

# Set the chaincode version
CHAINCODE_VERSION="1.0"

# Set the number of iterations for the performance test
ITERATIONS=100

# Function to invoke a chaincode
invoke_chaincode() {
  local args="$@"
  $FABRIC_BIN/peer chaincode invoke -o orderer.example.com:7050 \
    -C $CHANNEL_NAME \
    -n $CHAINCODE_NAME \
    -c '{"Args":['"$args"']}'
}

# Function to measure the execution time
measure_time() {
  local start_time=$(date +%s.%N)
  "$@"
  local end_time=$(date +%s.%N)
  local elapsed_time=$(echo "$end_time - $start_time" | bc -l)
  echo "$elapsed_time"
}

# Run the performance test
total_time=0

# Test createRoleCredential
for ((i=1; i<=$ITERATIONS; i++)); do
  echo "Iteration $i - Testing createRoleCredential:"
  elapsed_time=$(measure_time invoke_chaincode "createRoleCredential" "\"did:example:123\"" "[\"role1\", \"role2\"]" "\"Issuer\"")
  total_time=$(echo "$total_time + $elapsed_time" | bc -l)
  sleep 1
done

# Average execution time for createRoleCredential
average_time=$(echo "$total_time / $ITERATIONS" | bc -l)
echo "Average execution time for createRoleCredential: $average_time seconds"

# Reset for next test
total_time=0

# Test verifyRoleCredential
for ((i=1; i<=$ITERATIONS; i++)); do
  echo "Iteration $i - Testing verifyRoleCredential:"
  elapsed_time=$(measure_time invoke_chaincode "verifyRoleCredential" "\"did:example:123\"")
  total_time=$(echo "$total_time + $elapsed_time" | bc -l)
  sleep 1
done

# Average execution time for verifyRoleCredential
average_time=$(echo "$total_time / $ITERATIONS" | bc -l)
echo "Average execution time for verifyRoleCredential: $average_time seconds"

# Reset for next test
total_time=0

# Test revokeRoleCredential
for ((i=1; i<=$ITERATIONS; i++)); do
  echo "Iteration $i - Testing revokeRoleCredential:"
  elapsed_time=$(measure_time invoke_chaincode "revokeRoleCredential" "\"did:example:123\"" "\"Reason for revocation\"")
  total_time=$(echo "$total_time + $elapsed_time" | bc -l)
  sleep 1
done

# Average execution time for revokeRoleCredential
average_time=$(echo "$total_time / $ITERATIONS" | bc -l)
echo "Average execution time for revokeRoleCredential: $average_time seconds"

echo "Performance test completed."
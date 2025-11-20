import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function Vertex() {
    return <div>
        <p>Now obviously we won't always have hardcoded vertex data. What we need is a vertex buffer.</p>

        <p>First we need to update our vertex shader.</p>

<Code>{
`struct VSInput {
    float2 inPosition;
    float3 inColor;
};

struct VSOutput
{
    float4 pos : SV_Position;
    float3 color;
};

[shader("vertex")]
VSOutput vertMain(VSInput input) {
    VSOutput output;
    output.pos = float4(input.inPosition, 0.0, 1.0);
    output.color = input.inColor;
    return output;
}

[shader("fragment")]
float4 fragMain(VSOutput vertIn) : SV_TARGET {
    return float4(vertIn.color, 1.0);
}`}</Code>

and then also our <CodeFunc>vertex</CodeFunc> struct. 

<Code>{
`struct Vertex {
    glm::vec2 pos;
    glm::vec3 color;
};`}</Code>

Now we can make an array of these vertices.

<Code>{
`const std::vector<Vertex> vertices = {
    {{0.0f, -0.5f}, {1.0f, 0.0f, 0.0f}},
    {{0.5f, 0.5f}, {0.0f, 1.0f, 0.0f}},
    {{-0.5f, 0.5f}, {0.0f, 0.0f, 1.0f}}
};`}</Code>

<p>Now we need a to tell Vulkan how to give this data to the shader. We therefore make a "vertex binding" which describes how to load data from memory of the vertices. 
It does this by describing a rate of input data to load, and the number of bytes between each data entry. We do this by making a <CodeFunc>VkVertexInputBindingDescription</CodeFunc></p> as a member function of our Vertex struct.

<Code>{`static vk::VertexInputBindingDescription getBindingDescription() {
    return { 0, sizeof(Vertex), vk::VertexInputRate::eVertex };
}`}</Code>

Now we also need to describe how to handle the vertex input with <CodeFunc>VkVertexInuptAttributeDescription</CodeFunc> by adding another functino to our Vertex.
<Code>{`static std::array<vk::VertexInputAttributeDescription, 2> getAttributeDescriptions() {
    return {
        vk::VertexInputAttributeDescription( 0, 0, vk::Format::eR32G32Sfloat, offsetof(Vertex, pos) ),
        vk::VertexInputAttributeDescription( 1, 0, vk::Format::eR32G32B32Sfloat, offsetof(Vertex, color) )
    };
}`}</Code>

Here we describe how to extract the vertex attributes, where in our case we have two attributes, position and color. The first number indicates the location, and the second indicates the binding.

So if we have simply one vertex buffer as we have setup, our binding is 0 for both descriptions. However, we have position first, and color after, so position gets location 0, while color gets 1.

We can now modify the <CodeFunc>vertexInputInfo</CodeFunc> graphics pipeline:

<Code>{
`auto bindingDescription = Vertex::getBindingDescription();
auto attributeDescriptions = Vertex::getAttributeDescriptions();
vk::PipelineVertexInputStateCreateInfo vertexInputInfo {  .vertexBindingDescriptionCount =1, .pVertexBindingDescriptions = &bindingDescription,
    .vertexAttributeDescriptionCount = attributeDescriptions.size(), .pVertexAttributeDescriptions = attributeDescriptions.data() };`}</Code>

Now we need to bound a vertex buffer to the binding. We need to create a vertex buffer and move the vertex data so the GPU can access it.

<Code>{
`vk::raii::Buffer vertexBuffer = nullptr;

void initVulkan() {
    createInstance();
    setupDebugMessenger();
    createSurface();
    pickPhysicalDevice();
    createLogicalDevice();
    createSwapChain();
    createImageViews();
    createGraphicsPipeline();
    createCommandPool();
    createVertexBuffer();
    createCommandBuffers();
    createSyncObjects();
}

void createVertexBuffer() {
    vk::BufferCreateInfo bufferInfo{ .size = sizeof(vertices[0]) * vertices.size(), .usage = vk::BufferUsageFlagBits::eVertexBuffer, .sharingMode = vk::SharingMode::eExclusive };
    vertexBuffer = vk::raii::Buffer(device, bufferInfo);
}`}</Code>

<p>Although we have created the buffer, Vulkan's buffers do not automatically allocate memory for itself. We need to do the memory management ourselves, and therefore allocate it.</p>

<p>We allocate memory by first querying the memory requirements. Now since graphics cards can offer different types of memory, we need to find the right type to use.</p>
<Code>{
`uint32_t findMemoryType(uint32_t typeFilter, vk::MemoryPropertyFlags properties) {
    vk::PhysicalDeviceMemoryProperties memProperties = physicalDevice.getMemoryProperties();
    for (uint32_t i = 0; i < memProperties.memoryTypeCount; i++) {
        if ((typeFilter & (1 << i)) && (memProperties.memoryTypes[i].propertyFlags & properties) == properties) {
            return i;
        }
    }

    throw std::runtime_error("failed to find suitable memory type!");
}`}</Code>

<p>The <CodeFunc>typeFilter</CodeFunc> specifies the bit field of suitable types, so we simply check if the corresponding bit is 1. However, we also need to check that we can write our vertex data to that memory. 
Thus we use the <CodeFunc>memoryTypes</CodeFunc> array to check the properties.</p>

We can now allocate the memory.

<Code>{
`vk::raii::DeviceMemory vertexBufferMemory = nullptr;`}</Code>

along with allocation after initializing out vertex buffer.

<Code>{
`vk::MemoryRequirements memRequirements = vertexBuffer.getMemoryRequirements();
vk::MemoryAllocateInfo memoryAllocateInfo{.allocationSize = memRequirements.size, .memoryTypeIndex = findMemoryType(memRequirements.memoryTypeBits, vk::MemoryPropertyFlagBits::eHostVisible | vk::MemoryPropertyFlagBits::eHostCoherent)};
vertexBufferMemory = vk::raii::DeviceMemory(device, memoryAllocateInfo);`}</Code>

and finally bind!

<Code>{`vertexBuffer.bindMemory( *vertexBufferMemory, 0 );`}</Code>

Now to copy the vertex data to the buffer, we map the buffer memory into CPU accessible memory. Therefore, we treat our CPU memory as if we were writing directly to the GPU.

<Code>{`void* data = vertexBufferMemory.mapMemory(0, bufferInfo.size);
memcpy(data, vertices.data(), bufferInfo.size);
vertexBufferMemory.unmapMemory();`}</Code>

We can now bind the vertex buffer during rendering in our commands.

<Code>{`commandBuffers[currentFrame].bindPipeline(vk::PipelineBindPoint::eGraphics, *graphicsPipeline);

commandBuffers[currentFrame].bindVertexBuffers(0, *vertexBuffer, {0});`}</Code>

We can now play around with our vertices and see the triangle move!

<p>Now although this works correctly, the memory type that we are accessing is not the most optimal memory for the graphics card to read.
    The most optimal memory has the flag <CodeFunc>VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT</CodeFunc> but is usually not accessible by the CPU. 
    So what we want is to have the CPU write to a host-visible staging buffer that is slow but is mappable memory, and have the GPU copy from the staging into it's local device buffer.
    Therefore we make two vertex buffers, one "staging buffer" on the CPU and the final vertex buffer in the device local memmory and use a buffer copy command to move the data.
</p>

<p>Using the buffer copy command requires a queue family that supports it. However, since our queue that supports graphics implicitly supports queue transfers, we can use the same queue.</p>

Now let's move buffer creation to a different function since we will need to make multiple buffers.

<Code>{
`void createBuffer(vk::DeviceSize size, vk::BufferUsageFlags usage, vk::MemoryPropertyFlags properties, vk::raii::Buffer& buffer, vk::raii::DeviceMemory& bufferMemory) {
    vk::BufferCreateInfo bufferInfo{ .size = size, .usage = usage, .sharingMode = vk::SharingMode::eExclusive };
    buffer = vk::raii::Buffer(device, bufferInfo);
    vk::MemoryRequirements memRequirements = buffer.getMemoryRequirements();
    vk::MemoryAllocateInfo allocInfo{ .allocationSize = memRequirements.size, .memoryTypeIndex = findMemoryType(memRequirements.memoryTypeBits, properties) };
    bufferMemory = vk::raii::DeviceMemory(device, allocInfo);
    buffer.bindMemory(*bufferMemory, 0);
}`}</Code>

and so we can modify <CodeFunc>createVertexBuffer</CodeFunc> to:

<Code>{
`void createVertexBuffer() {
    vk::DeviceSize bufferSize = sizeof(vertices[0]) * vertices.size();
    createBuffer(bufferSize, vk::BufferUsageFlagBits::eVertexBuffer, vk::MemoryPropertyFlagBits::eHostVisible | vk::MemoryPropertyFlagBits::eHostCoherent, vertexBuffer, vertexBufferMemory);
    void* data = vertexBufferMemory.mapMemory(0, bufferSize);
    memcpy(data, vertices.data(), (size_t) bufferSize);
    vertexBufferMemory.unmapMemory();
}`}</Code>

<p>Now we are going to use a staging buffer that is only visible to the host as a temporary buffer, and us ethe device local buffer as the actual vertex buffer. 
    We make a new staging buffer with <CodeFunc>stagingBufferMemory</CodeFunc> to map and copy the vertex data. We then allocate <CodeFunc>vertexBuffer</CodeFunc> using device local memory.
<Code>{
`void createVertexBuffer() {
    vk::DeviceSize bufferSize = sizeof(vertices[0]) * vertices.size();

    vk::BufferCreateInfo stagingInfo{ .size = bufferSize, .usage = vk::BufferUsageFlagBits::eTransferSrc, .sharingMode = vk::SharingMode::eExclusive };
    vk::raii::Buffer stagingBuffer(device, stagingInfo);
    vk::MemoryRequirements memRequirementsStaging = stagingBuffer.getMemoryRequirements();
    vk::MemoryAllocateInfo memoryAllocateInfoStaging{  .allocationSize = memRequirementsStaging.size, .memoryTypeIndex = findMemoryType(memRequirementsStaging.memoryTypeBits, vk::MemoryPropertyFlagBits::eHostVisible | vk::MemoryPropertyFlagBits::eHostCoherent) };
    vk::raii::DeviceMemory stagingBufferMemory(device, memoryAllocateInfoStaging);

    stagingBuffer.bindMemory(stagingBufferMemory, 0);
    void* dataStaging = stagingBufferMemory.mapMemory(0, stagingInfo.size);
    memcpy(dataStaging, vertices.data(), stagingInfo.size);
    stagingBufferMemory.unmapMemory();

    vk::BufferCreateInfo bufferInfo{ .size = bufferSize,  .usage = vk::BufferUsageFlagBits::eVertexBuffer | vk::BufferUsageFlagBits::eTransferDst, .sharingMode = vk::SharingMode::eExclusive };
    vertexBuffer = vk::raii::Buffer(device, bufferInfo);

    vk::MemoryRequirements memRequirements = vertexBuffer.getMemoryRequirements();
    vk::MemoryAllocateInfo memoryAllocateInfo{  .allocationSize = memRequirements.size, .memoryTypeIndex = findMemoryType(memRequirements.memoryTypeBits, vk::MemoryPropertyFlagBits::eDeviceLocal) };
    vertexBufferMemory = vk::raii::DeviceMemory( device, memoryAllocateInfo );

    vertexBuffer.bindMemory( *vertexBufferMemory, 0 );

    copyBuffer(stagingBuffer, vertexBuffer, stagingInfo.size);
}`}</Code>

Now we can copy data from <CodeFunc>stagingBuffer</CodeFunc> to <CodeFunc>vertexBuffer</CodeFunc>. 
</p>

<p>We indicated that we intend to do this by specifying the transfer source flags for the staging buffer and the tranfer destination flag for the device local vertex buffer.
    We do this by making a function the copy the contents from one buffer to another and utilizing command buffers.
<Code>{
`void copyBuffer(vk::raii::Buffer& srcBuffer, vk::raii::Buffer& dstBuffer, vk::DeviceSize size) {
    vk::CommandBufferAllocateInfo allocInfo{ .commandPool = commandPool, .level = vk::CommandBufferLevel::ePrimary, .commandBufferCount = 1 };
    vk::raii::CommandBuffer       commandCopyBuffer = std::move(device.allocateCommandBuffers(allocInfo).front());
    commandCopyBuffer.begin(vk::CommandBufferBeginInfo{ .flags = vk::CommandBufferUsageFlagBits::eOneTimeSubmit });
    commandCopyBuffer.copyBuffer(*srcBuffer, *dstBuffer, vk::BufferCopy(0, 0, size));
    commandCopyBuffer.end();
    queue.submit(vk::SubmitInfo{ .commandBufferCount = 1, .pCommandBuffers = &*commandCopyBuffer }, nullptr);
    queue.waitIdle();
}`}</Code>
</p>

<p>Now we should do triangle indexing, which becomes useful especially at higher amounts of triangles with redundant vertices.</p>

We start with the vertices for a rectangle:

<Code>{
`const std::vector<Vertex> vertices = {
    {{-0.5f, -0.5f}, {1.0f, 0.0f, 0.0f}},
    {{0.5f, -0.5f}, {0.0f, 1.0f, 0.0f}},
    {{0.5f, 0.5f}, {0.0f, 0.0f, 1.0f}},
    {{-0.5f, 0.5f}, {1.0f, 1.0f, 1.0f}}
};`}</Code>

along with it's triangle vertex indices:

<Code>{`const std::vector<uint16_t> indices = {
    0, 1, 2, 2, 3, 0
};`}</Code>

Now just like vertices, we need a buffer for the GPU to acces them. 

<Code>{`vk::raii::Buffer indexBuffer = nullptr;
vk::raii::DeviceMemory indexBufferMemory = nullptr;`}</Code>

and then creating the index buffer is quite similar to creating our vertex buffer, but changing the buffer flag and the size.

<Code>{
`void createIndexBuffer() {
    vk::DeviceSize bufferSize = sizeof(indices[0]) * indices.size();

    vk::raii::Buffer stagingBuffer({});
    vk::raii::DeviceMemory stagingBufferMemory({});
    createBuffer(bufferSize, vk::BufferUsageFlagBits::eTransferSrc, vk::MemoryPropertyFlagBits::eHostVisible | vk::MemoryPropertyFlagBits::eHostCoherent, stagingBuffer, stagingBufferMemory);

    void* data = stagingBufferMemory.mapMemory(0, bufferSize);
    memcpy(data, indices.data(), (size_t)bufferSize);
    stagingBufferMemory.unmapMemory();

    createBuffer(bufferSize, vk::BufferUsageFlagBits::eTransferDst | vk::BufferUsageFlagBits::eIndexBuffer, vk::MemoryPropertyFlagBits::eDeviceLocal, indexBuffer, indexBufferMemory);

    copyBuffer(stagingBuffer, indexBuffer, bufferSize);
}`}</Code>

while also updating our commands to draw to use the indexed buffer:

<Code>{
`commandBuffers[currentFrame].bindVertexBuffers(0, *vertexBuffer, { 0 });
commandBuffers[currentFrame].bindIndexBuffer(*indexBuffer, 0, vk::IndexType::eUint16);
commandBuffers[currentFrame].drawIndexed(indices.size(), 1, 0, 0, 0);`}</Code>

</div>
}